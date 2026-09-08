import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { verifySessionCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("session="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await verifySessionCookie(sessionCookie);

    const body = await request.json();

    const displayName =
      typeof body?.displayName === "string" ? body.displayName.trim() : null;

    const email =
      typeof body?.email === "string"
        ? body.email.trim()
        : (decodedToken.email ?? null);

    const photoURL = typeof body?.photoURL === "string" ? body.photoURL : null;

    const status = typeof body?.status === "string" ? body.status.trim() : null;

    await adminDb.collection("users").doc(decodedToken.uid).set(
      {
        displayName,
        email,
        photoURL,
        status,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create user profile:", error);

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
