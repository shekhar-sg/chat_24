import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname === "/login" || pathname === "/signup") {
    if (!session) {
      return NextResponse.next();
    }

    try {
      await adminAuth.verifySessionCookie(session, true);

      return NextResponse.redirect(new URL("/", request.url));
    } catch {
      const response = NextResponse.next();

      response.cookies.delete("session");

      return response;
    }
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await adminAuth.verifySessionCookie(session, true);

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("session");

    return response;
  }
}

export const config = {
  matcher: ["/", "/login", "/signup", "/chat/:path*", "/conversation/:path*"],
};
