import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firestore";
import { FirestoreConversation } from "@/types/firestore";
import type { FirestoreError } from "firebase/firestore";

export function getDirectConversationId(uidA: string, uidB: string) {
  const [firstUid, secondUid] = [uidA, uidB].sort();

  return `${firstUid}_${secondUid}`;
}

export function getConversationRef(conversationId: string) {
  return doc(db, "conversations", conversationId);
}

export async function getOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string
) {
  if (currentUserId === otherUserId) {
    throw new Error("A user cannot start a conversation with themselves.");
  }

  const conversationId = getDirectConversationId(currentUserId, otherUserId);

  const conversationRef = getConversationRef(conversationId);
  const snapshot = await getDoc(conversationRef);

  if (!snapshot.exists()) {
    await setDoc(conversationRef, {
      type: "direct",
      participantIds: [currentUserId, otherUserId],
      lastMessage: null,
      lastMessageAt: null,
      createdAt: serverTimestamp(),
    });
  }

  return conversationId;
}

export function subscribeToUserConversations(
  uid: string,
  onData: (conversations: FirestoreConversation[]) => void,
  onError: (error: FirestoreError) => void
) {
  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", uid),
    orderBy("lastMessageAt", "desc"),
    limit(30)
  );

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      })) as FirestoreConversation[];

      onData(conversations);
    },
    onError
  );
}
