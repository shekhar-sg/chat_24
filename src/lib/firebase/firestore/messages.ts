import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";

export async function sendMessage({
  conversationId,
  senderId,
  text,
  recipientId,
}: {
  conversationId: string;
  senderId: string;
  text: string;
  recipientId: string;
}) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Message cannot be empty.");
  }

  const batch = writeBatch(db);

  const conversationRef = doc(db, "conversations", conversationId);

  const messageRef = doc(
    collection(db, "conversations", conversationId, "messages")
  );

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
      createdAt: serverTimestamp(),
    },
    lastMessageAt: serverTimestamp(),
    [`unreadCounts.${recipientId}`]: increment(1),
  });

  await batch.commit();

  return messageRef.id;
}
