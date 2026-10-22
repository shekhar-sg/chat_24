import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/get-current-user";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { isDocumentId } from "@/lib/server/request";
import { isCloudinaryFileUrl } from "@/lib/chat";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const conversationId = params.get("conversationId"),
    messageId = params.get("messageId");
  if (!isDocumentId(conversationId) || !isDocumentId(messageId))
    return NextResponse.json(
      { error: "Invalid attachment reference" },
      { status: 400 }
    );
  try {
    const ref = adminDb.collection("conversations").doc(conversationId);
    const conversation = await ref.get();
    if (
      !conversation.exists ||
      !conversation.data()?.participantIds.includes(user.uid)
    )
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const message = (
      await ref.collection("messages").doc(messageId).get()
    ).data();
    if (
      message?.type !== "file" ||
      !isCloudinaryFileUrl(
        message.fileUrl,
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
      )
    )
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const response = await fetch(message.fileUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
    if (!response.ok)
      return NextResponse.json(
        { error: "File is temporarily unavailable" },
        { status: 502 }
      );
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(message.fileName).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to download this file. Try again." },
      { status: 502 }
    );
  }
}
