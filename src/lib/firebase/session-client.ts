import type { User } from "firebase/auth";

export async function createServerSession(user: User) {
  const csrfResponse = await fetch("/api/auth/csrf", { cache: "no-store" });
  if (!csrfResponse.ok)
    throw new Error("Unable to initialize sign-in. Try again.");
  const { csrfToken } = await csrfResponse.json();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await user.getIdToken(true), csrfToken }),
  });
  if (!response.ok)
    throw new Error("Unable to create a secure session. Please sign in again.");
}

export async function clearServerSession() {
  const response = await fetch("/api/auth/session", { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to clear your session. Try again.");
}
