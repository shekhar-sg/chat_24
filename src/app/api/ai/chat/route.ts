import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/get-current-user";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { isSameOrigin } from "@/lib/server/request";
import { parseAIRequest } from "@/lib/ai-policy";
import { answerWithGemini } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 40;
const json = (
  body: object,
  status = 200,
  headers: Record<string, string> = {}
) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Please sign in again." }, 401);
  // Bound streamed bytes as well as declared length before JSON parsing.
  let size = 0;
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Invalid request." }, 400);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 40000) {
        await reader.cancel();
        return json({ error: "Request is too large." }, 413);
      }
      chunks.push(value);
    }
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  let input;
  try {
    input = parseAIRequest(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!input) return json({ error: "Invalid assistant request." }, 400);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30000)]);
  let stage = "conversation";
  try {
    const conversationRef = adminDb
      .collection("conversations")
      .doc(input.conversationId);
    const conversation = await conversationRef.get();
    if (
      !conversation.exists ||
      !conversation.data()?.participantIds?.includes(user.uid)
    )
      return json({ error: "Conversation unavailable." }, 404);
    if (!process.env.GEMINI_API_KEY)
      return json(
        {
          error:
            "The assistant is not configured yet. Add a Gemini API key on the server.",
        },
        503
      );
    stage = "quota";
    const quotaRef = adminDb.collection("aiRateLimits").doc(user.uid);
    const allowed = await adminDb.runTransaction(async (transaction) => {
      const quota = (await transaction.get(quotaRef)).data();
      const now = Date.now();
      const active =
        typeof quota?.startedAt === "number" && now - quota.startedAt < 60000;
      if (active && quota.count >= 5) return false;
      transaction.set(quotaRef, {
        startedAt: active ? quota.startedAt : now,
        count: active ? quota.count + 1 : 1,
      });
      return true;
    });
    if (!allowed)
      return json({ error: "Please wait a minute before asking again." }, 429, {
        "Retry-After": "60",
      });
    stage = "messages";
    const snapshot = await conversationRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();
    const messages = snapshot.docs
      .reverse()
      .map((doc) => {
        const data = doc.data();
        return {
          sender: data.senderId === user.uid ? "you" : "other participant",
          text: String(
            data.type === "text" ? data.text || "" : data.caption || ""
          ).slice(0, 2000),
        };
      })
      .filter((message) => message.text);
    // Bound total context independently of the number of Firestore documents.
    let remaining = 12000;
    const bounded = messages
      .reverse()
      .flatMap((message) => {
        if (!remaining) return [];
        const text = message.text.slice(0, remaining);
        remaining -= text.length;
        return [{ ...message, text }];
      })
      .reverse();
    stage = "gemini";
    return json(await answerWithGemini(input, bounded, signal));
  } catch (error) {
    if (signal.aborted)
      return json(
        { error: "The assistant took too long. Please try again." },
        504
      );
    const status = (error as { status?: number }).status;
    // Never log provider payloads, credentials or chat content.
    console.error("Assistant request failed", {
      stage,
      status: typeof status === "number" ? status : "unknown",
    });
    if (stage === "gemini" && status === 404)
      return json(
        {
          error:
            "The configured Gemini model is unavailable for this API key. Update GEMINI_MODEL on the server and restart or redeploy.",
        },
        503
      );
    if (stage === "gemini" && (status === 401 || status === 403))
      return json(
        {
          error:
            "Gemini rejected the server's API key or project permissions. Check GEMINI_API_KEY and model access.",
        },
        503
      );
    if (stage === "gemini" && status === 400)
      return json(
        {
          error:
            "Gemini rejected the server configuration. Check the API key, selected model, and supported request settings.",
        },
        503
      );
    if (stage === "gemini" && status === 503)
      return json(
        { error: "Gemini is currently overloaded. Please try again shortly." },
        503,
        { "Retry-After": "10" }
      );
    if (status === 429)
      return json(
        {
          error:
            "Gemini's free quota is temporarily exhausted. Please try again later.",
        },
        429,
        { "Retry-After": "60" }
      );
    return json(
      { error: "The assistant is temporarily unavailable. Please try again." },
      502
    );
  }
}
