import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrfToken";

export async function GET() {
  const csrfToken = randomBytes(32).toString("hex");

  const response = NextResponse.json(
    {
      csrfToken,
    },
    { headers: { "Cache-Control": "no-store" } }
  );

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
