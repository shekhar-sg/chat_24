import { cookies } from "next/headers";

import { verifySessionCookie } from "@/lib/firebase/auth-server";

export async function getCurrentUser() {
  const sessionCookie = (await cookies()).get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return await verifySessionCookie(sessionCookie);
  } catch {
    return null;
  }
}
