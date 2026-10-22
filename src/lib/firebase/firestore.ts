import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

import { firebaseApp } from "@/lib/firebase";

export const db = getFirestore(firebaseApp);

// This flag must be set at build/dev startup, and must never be enabled in production.
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  const globalState = globalThis as typeof globalThis & {
    firestoreEmulatorConnected?: boolean;
  };
  if (!globalState.firestoreEmulatorConnected) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    globalState.firestoreEmulatorConnected = true;
  }
}
