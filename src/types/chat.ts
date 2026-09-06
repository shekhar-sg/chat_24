import { Timestamp } from "firebase/firestore";

export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  type: "text";
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  edited: boolean;
}
