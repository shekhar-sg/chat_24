import type { Timestamp } from "firebase/firestore";

export interface FirestoreUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  status: string | null;
}

export interface LastMessage {
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

export interface FirestoreConversation {
  id: string;
  type: "direct";
  participantIds: string[];
  lastMessage: LastMessage | null;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface FirestoreMessage {
  senderId: string;
  text: string;
  type: "text";
  createdAt: Timestamp;
}
