import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { Message } from "@/types/chat";

const getDirectConversationId = (userId1: string, userId2: string) =>
  [userId1, userId2].sort().join("_");

export const getOrCreateDirectConversation = async (
  currentUserId: string,
  otherUserId: string
) => {
  const conversationId = getDirectConversationId(currentUserId, otherUserId);

  const conversationRef = doc(db, "conversations", conversationId);
  const conversationSnapshot = await getDoc(conversationRef);

  if (!conversationSnapshot.exists()) {
    await setDoc(conversationRef, {
      type: "direct",
      participants: [currentUserId, otherUserId],
      lastMessage: "",
      lastMessageAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return conversationId;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string
) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Message cannot be empty");
  }

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const messageRef = await addDoc(messagesRef, {
    senderId,
    text: trimmedText,
    type: "text",
    edited: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: trimmedText,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return messageRef.id;
};

export const subscribeToMessages = (
  conversationId: string,
  onMessages: (messages: Message[]) => void
) => {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((messageDoc) => ({
      id: messageDoc.id,
      ...messageDoc.data(),
    })) as Message[];

    onMessages(messages);
  });
};

export const getLatestMessages = async (conversationId: string) => {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "desc"),
    limit(30)
  );

  const snapshot = await getDocs(messagesQuery);

  return {
    messages: snapshot.docs
      .map(
        (messageDoc) =>
          ({
            id: messageDoc.id,
            ...messageDoc.data(),
          }) as Message
      )
      .reverse(),

    lastDoc: snapshot.docs.at(-1) ?? null,
  };
};

export const getOlderMessages = async (
  conversationId: string,
  lastDoc: QueryDocumentSnapshot<DocumentData>
) => {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(30)
  );

  const snapshot = await getDocs(messagesQuery);

  return {
    messages: snapshot.docs
      .map(
        (messageDoc) =>
          ({
            id: messageDoc.id,
            ...messageDoc.data(),
          }) as Message
      )
      .reverse(),

    lastDoc: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === 30,
  };
};
