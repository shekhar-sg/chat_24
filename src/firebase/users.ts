import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { db } from "./config";

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  createdAt: number | null;
}

const userConverter: FirestoreDataConverter<FirestoreUser> = {
  toFirestore(user) {
    return {
      uid: user.uid,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: user.createdAt,
    };
  },

  fromFirestore(snapshot) {
    const data = snapshot.data();

    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      photoURL: data.photoURL ?? null,
      createdAt: data.createdAt ?? null,
    };
  },
};

const usersCollection = collection(db, "users").withConverter(userConverter);

export const createUserProfile = async (
  uid: string,
  data: {
    name: string;
    email: string;
    photoURL?: string;
  }
) => {
  await setDoc(doc(usersCollection, uid), {
    uid,
    name: data.name.trim(),
    email: data.email,
    photoURL: data.photoURL ?? null,
    createdAt: null,
  });

  await setDoc(
    doc(usersCollection, uid),
    { createdAt: serverTimestamp() },
    { merge: true }
  );
};

export const getUsers = async (
  currentUserId: string
): Promise<FirestoreUser[]> => {
  const usersQuery = query(usersCollection, orderBy("uid"));
  const snapshot = await getDocs(usersQuery);

  return snapshot.docs
    .map((doc) => doc.data())
    .filter((user) => user.uid !== currentUserId);
};
