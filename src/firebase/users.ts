import { doc, setDoc } from "firebase/firestore";
import { db } from "./config";

export const createUserProfile = async (
  uid: string,
  data: {
    name: string;
    email: string;
    photoURL?: string;
  }
) => {
  await setDoc(doc(db, "users", uid), {
    uid,
    name: data.name,
    email: data.email,
    photoURL: data.photoURL ?? null,
    createdAt: new Date(),
  });
};
