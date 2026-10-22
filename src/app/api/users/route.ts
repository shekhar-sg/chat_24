import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { getCurrentUser } from "@/lib/firebase/get-current-user";
import { isSameOrigin } from "@/lib/server/request";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";
  if (!displayName || displayName.length > 80)
    return NextResponse.json(
      { error: "Display name must contain 1–80 characters." },
      { status: 400 }
    );
  try {
    const ref = adminDb.collection("users").doc(user.uid);
    await adminDb.runTransaction(async (transaction) => {
      const profile = await transaction.get(ref);
      if (!profile.exists)
        transaction.create(ref, {
          displayName,
          email: user.email ?? null,
          photoURL: null,
          status: null,
        });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to save your profile. Please retry." },
      { status: 503 }
    );
  }
}
