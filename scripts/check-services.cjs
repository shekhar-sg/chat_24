const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const { cert, initializeApp } = require("firebase-admin/app");
const { v2: cloudinary } = require("cloudinary");
(async () => {
  try {
    const credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    });
    initializeApp({ credential });
    const { access_token } = await credential.getAccessToken();
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!response.ok) throw new Error("Firebase metadata unavailable");
    const database = await response.json();
    console.log(
      `Firebase credentials: OK; edition=${database.databaseEdition}; location=${database.locationId}`
    );
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.api.ping({ timeout: 15000 });
    console.log("Cloudinary credentials: OK");
  } catch {
    console.error(
      "Service check failed. Verify network access and credentials; no secret values have been logged."
    );
    process.exitCode = 1;
  }
})();
