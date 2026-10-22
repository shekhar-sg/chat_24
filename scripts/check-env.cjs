const { loadEnvConfig } = require("@next/env");
const { createPrivateKey } = require("node:crypto");
loadEnvConfig(process.cwd());
const names = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
let valid = true;
for (const name of names) {
  const ok = Boolean(process.env[name]?.trim());
  console.log(`${name}: ${ok ? "configured" : "MISSING"}`);
  valid &&= ok;
}
if (
  process.env.FIREBASE_PROJECT_ID !==
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
) {
  console.error("Firebase client/server project IDs do not match.");
  valid = false;
}
try {
  createPrivateKey(
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || ""
  );
  console.log("Firebase private key: valid PEM");
} catch {
  console.error("Firebase private key: invalid PEM");
  valid = false;
}
process.exitCode = valid ? 0 : 1;
