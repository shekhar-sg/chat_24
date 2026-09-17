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
  writeBatch,
  where,
  FirestoreError,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import type { FirestoreConversation } from "@/types/firestore";

const CONVERSATION_LIMIT = 30;

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

export async function sendTextMessage(
  conversationId: string,
  senderId: string,
  text: string
) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Message cannot be empty.");
  }

  const conversationRef = getConversationRef(conversationId);

  const messageRef = doc(
    collection(db, "conversations", conversationId, "messages")
  );

  const batch = writeBatch(db);

  batch.set(messageRef, {
    senderId,
    text: trimmedText,
    type: "text",
    createdAt: serverTimestamp(),
  });

  batch.update(conversationRef, {
    lastMessage: {
      text: trimmedText,
      senderId,
      type: "text",
      createdAt: serverTimestamp(),
    },
    lastMessageAt: serverTimestamp(),
  });

  await batch.commit();

  return messageRef.id;
}

interface SendFileMessageInput {
  senderId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}

export async function sendFileMessage(
  conversationId: string,
  input: SendFileMessageInput
) {
  if (!input.fileName.trim()) {
    throw new Error("File name is required.");
  }

  if (!input.fileUrl) {
    throw new Error("File URL is required.");
  }

  if (input.fileSize <= 0) {
    throw new Error("Invalid file size.");
  }

  if (!input.contentType) {
    throw new Error("File type is required.");
  }

  const conversationRef = getConversationRef(conversationId);

  const messageRef = doc(
    collection(db, "conversations", conversationId, "messages")
  );

  const batch = writeBatch(db);

  batch.set(messageRef, {
    senderId: input.senderId,
    type: "file",
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    fileSize: input.fileSize,
    contentType: input.contentType,
    createdAt: serverTimestamp(),
  });

  batch.update(conversationRef, {
    lastMessage: {
      type: "file",
      fileName: input.fileName,
      senderId: input.senderId,
      createdAt: serverTimestamp(),
    },
    lastMessageAt: serverTimestamp(),
  });

  await batch.commit();

  return messageRef.id;
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
    limit(CONVERSATION_LIMIT)
  );

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs.map((conversationSnapshot) => ({
        id: conversationSnapshot.id,
        ...conversationSnapshot.data(),
      })) as FirestoreConversation[];

      onData(conversations);
    },
    onError
  );
}
