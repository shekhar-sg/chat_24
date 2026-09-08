export interface FirestoreUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  status: string | null;
}

export interface LastMessage {
  text: string;
  senderId: string;
  createdAt: number;
}

export interface FirestoreConversation {
  id: string;
  type: "direct";
  participantIds: string[];
  lastMessage: LastMessage | null;
  lastMessageAt: number | null;
  createdAt: number;
}

export interface FirestoreMessage {
  senderId: string;
  text: string;
  type: "text";
  createdAt: number;
}
