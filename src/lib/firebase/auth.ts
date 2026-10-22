import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  connectAuthEmulator,
} from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

export const auth = getAuth(firebaseApp);

if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  !auth.emulatorConfig
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};
