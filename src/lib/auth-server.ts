import { adminAuth } from "@/lib/firebase-admin";

export async function verifySessionCookie(sessionCookie: string) {
  return adminAuth.verifySessionCookie(sessionCookie, true);
}
