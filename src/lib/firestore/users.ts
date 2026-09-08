import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firestore";
import type { FirestoreUser } from "@/types/firestore";

const MAX_IDS_PER_QUERY = 30;

export interface FirestoreUserWithId extends FirestoreUser {
  id: string;
}

export async function getUsersByIds(
  userIds: string[]
): Promise<FirestoreUserWithId[]> {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

  if (uniqueUserIds.length === 0) {
    return [];
  }

  const users: FirestoreUserWithId[] = [];

  for (
    let start = 0;
    start < uniqueUserIds.length;
    start += MAX_IDS_PER_QUERY
  ) {
    const chunk = uniqueUserIds.slice(start, start + MAX_IDS_PER_QUERY);

    const usersQuery = query(
      collection(db, "users"),
      where(documentId(), "in", chunk)
    );

    const snapshot = await getDocs(usersQuery);

    snapshot.docs.forEach((userDoc) => {
      users.push({
        id: userDoc.id,
        ...(userDoc.data() as FirestoreUser),
      });
    });
  }

  return users;
}
