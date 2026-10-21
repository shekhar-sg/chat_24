import type { DocumentData } from "firebase/firestore";
import type { FirestoreConversation, MessageWithId } from "@/types/firestore";
import { timestampToMillis } from "@/lib/chat";

export function conversationFromDoc(
  id: string,
  data: DocumentData
): FirestoreConversation {
  return {
    id,
    type: "direct",
    participantIds: data.participantIds,
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          createdAt: timestampToMillis(data.lastMessage.createdAt),
        }
      : null,
    lastMessageAt: timestampToMillis(data.lastMessageAt),
    createdAt: timestampToMillis(data.createdAt),
    readAt: Object.fromEntries(
      Object.entries(data.readAt ?? {}).map(([uid, value]) => [
        uid,
        timestampToMillis(value),
      ])
    ),
    typing: data.typing ?? {},
    typingAt: Object.fromEntries(
      Object.entries(data.typingAt ?? {}).map(([uid, value]) => [
        uid,
        timestampToMillis(value),
      ])
    ),
  };
}

export function messageFromDoc(id: string, data: DocumentData): MessageWithId {
  const common = {
    id,
    senderId: data.senderId,
    createdAt: timestampToMillis(data.createdAt),
  };
  return data.type === "file"
    ? {
        ...common,
        type: "file",
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        contentType: data.contentType,
        caption: data.caption,
      }
    : { ...common, type: "text", text: data.text };
}
