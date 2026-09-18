export interface FirestoreUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  status: string | null;
}

export type MessageType = "text" | "file";

export type MessageWithId = FirestoreMessage & {
  id: string;
};

export interface TextMessage {
  type: "text";
  text: string;
  senderId: string;
  createdAt: number;
}

export interface FileMessage {
  type: "file";
  senderId: string;
  createdAt: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}

export type FirestoreMessage = TextMessage | FileMessage;

export interface LastMessage {
  type: MessageType;
  text?: string;
  senderId: string;
  createdAt: number;
  fileName?: string;
}

export interface FirestoreConversation {
  id: string;
  type: "direct";
  participantIds: string[];
  lastMessage: LastMessage | null;
  lastMessageAt: number | null;
  readAt: Record<string, number | null>;
  createdAt: number;
}
