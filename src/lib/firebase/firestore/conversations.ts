import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  FieldPath,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { MAX_MESSAGE_LENGTH, validateAttachment } from "@/lib/chat";

export function getDirectConversationId(uidA: string, uidB: string) {
  const [firstUid, secondUid] = [uidA, uidB].sort();
  return `${firstUid}_${secondUid}`;
}
export function getConversationRef(id: string) {
  return doc(db, "conversations", id);
}

export async function getOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string
) {
  if (!currentUserId || !otherUserId || currentUserId === otherUserId)
    throw new Error("Choose another user to start a conversation.");
  const conversationId = getDirectConversationId(currentUserId, otherUserId);
  const ref = getConversationRef(conversationId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists()) {
      if (
        !snapshot.data().participantIds.includes(currentUserId) ||
        !snapshot.data().participantIds.includes(otherUserId)
      )
        throw new Error("Invalid conversation participants.");
      return;
    }
    transaction.set(ref, {
      type: "direct",
      participantIds: [currentUserId, otherUserId],
      lastMessage: null,
      lastMessageAt: null,
      readAt: { [currentUserId]: null, [otherUserId]: null },
      typing: { [currentUserId]: false, [otherUserId]: false },
      typingAt: { [currentUserId]: null, [otherUserId]: null },
      createdAt: serverTimestamp(),
    });
  });
  return conversationId;
}

export async function markConversationAsRead(id: string, uid: string) {
  await updateDoc(
    getConversationRef(id),
    new FieldPath("readAt", uid),
    serverTimestamp()
  );
}
export async function setUserTyping(id: string, uid: string, typing: boolean) {
  await updateDoc(
    getConversationRef(id),
    new FieldPath("typing", uid),
    typing,
    new FieldPath("typingAt", uid),
    serverTimestamp()
  );
}

interface FileInput {
  senderId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  caption?: string;
}

async function commitMessage(
  id: string,
  message:
    | { senderId: string; type: "text"; text: string }
    | (FileInput & { type: "file" })
) {
  const conversationRef = getConversationRef(id);
  const messageRef = doc(collection(conversationRef, "messages"));
  const batch = writeBatch(db);
  batch.set(messageRef, { ...message, createdAt: serverTimestamp() });
  batch.update(conversationRef, {
    lastMessage: {
      type: message.type,
      senderId: message.senderId,
      messageId: messageRef.id,
      ...(message.type === "text"
        ? { text: message.text }
        : { fileName: message.fileName }),
      createdAt: serverTimestamp(),
    },
    lastMessageAt: serverTimestamp(),
  });
  await batch.commit();
  return messageRef.id;
}
export async function sendTextMessage(
  id: string,
  senderId: string,
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH)
    throw new Error("Messages must contain 1–10,000 characters.");
  return commitMessage(id, { senderId, type: "text", text: trimmed });
}
export async function sendFileMessage(id: string, input: FileInput) {
  validateAttachment(
    input,
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  );
  const caption = input.caption?.trim() || "";
  if (caption.length > MAX_MESSAGE_LENGTH)
    throw new Error("Caption exceeds 10,000 characters.");
  return commitMessage(id, { ...input, caption, type: "file" });
}
