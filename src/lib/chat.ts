import type { FirestoreConversation, LastMessage } from "@/types/firestore";

export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export function timestampToMillis(value: unknown): number | null {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  )
    return value.toMillis();
  return null;
}

export function messagePreview(message: LastMessage | null): string {
  if (!message) return "No messages yet";
  return message.type === "file"
    ? message.fileName || "Attachment"
    : message.text || "";
}

export function hasUnreadMessage(
  conversation: FirestoreConversation,
  uid: string
): boolean {
  const last = conversation.lastMessage;
  return Boolean(
    last &&
      last.senderId !== uid &&
      last.createdAt !== null &&
      last.createdAt > (conversation.readAt[uid] ?? 0)
  );
}

export function isCloudinaryFileUrl(value: string, cloudName: string): boolean {
  try {
    const url = new URL(value);
    return (
      Boolean(cloudName) &&
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.startsWith(`/${cloudName}/`) &&
      /\/(image|raw|video)\/upload\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function validateAttachment(
  file: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    contentType: string;
  },
  cloudName: string
) {
  if (
    !file.fileName.trim() ||
    file.fileName.length > 255 ||
    !Number.isInteger(file.fileSize) ||
    file.fileSize <= 0 ||
    file.fileSize > MAX_FILE_SIZE ||
    !ALLOWED_CONTENT_TYPES.includes(file.contentType) ||
    !isCloudinaryFileUrl(file.fileUrl, cloudName)
  ) {
    throw new Error("Choose a JPG, PNG, WebP, or PDF file up to 10 MB.");
  }
}
