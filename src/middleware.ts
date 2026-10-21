import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.cookies.get("session")?.value)
    return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
// Server layouts verify the cookie. APIs perform their own authorization.
export const config = { matcher: ["/", "/conversation/:path*"] };
