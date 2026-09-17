import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase/firebase-admin";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;
const RECENT_SIGN_IN_WINDOW_SECONDS = 5 * 60;
const CSRF_COOKIE_NAME = "csrfToken";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const idToken = typeof body?.idToken === "string" ? body.idToken : null;

    const csrfToken =
      typeof body?.csrfToken === "string" ? body.csrfToken : null;

    if (!idToken || !csrfToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieHeader = request.headers.get("cookie") ?? "";

    const csrfCookie = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!csrfCookie || csrfCookie !== csrfToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const authTime = decodedToken.auth_time;

    if (
      typeof authTime !== "number" ||
      Math.floor(Date.now() / 1000) - authTime > RECENT_SIGN_IN_WINDOW_SECONDS
    ) {
      return NextResponse.json(
        { error: "Recent sign-in required" },
        { status: 401 }
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "session",
      value: sessionCookie,
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to create auth session:", error);

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: "session",
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
