"use client";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { IconButton, Tooltip } from "@mui/material";
import { useEffect, useRef } from "react";
import {
  validateAttachment,
  MAX_FILE_SIZE,
  ALLOWED_CONTENT_TYPES,
} from "@/lib/chat";
export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}

export default function FileUploadButton({
  conversationId,
  disabled,
  onUpload,
  onUploadStart,
  onUploadError,
  onClose,
}: {
  conversationId: string;
  disabled?: boolean;
  onUpload: (file: UploadedFile) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: unknown) => void;
  onClose?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (
            file.size <= 0 ||
            file.size > MAX_FILE_SIZE ||
            !ALLOWED_CONTENT_TYPES.includes(file.type)
          ) {
            onUploadError?.(new Error("Invalid file"));
            return;
          }
          onUploadStart?.();
          controller.current = new AbortController();
          try {
            const data = new FormData();
            data.set("file", file);
            data.set("conversationId", conversationId);
            const response = await fetch("/api/files/upload", {
              method: "POST",
              body: data,
              signal: controller.current.signal,
            });
            if (!response.ok) {
              const failure = await response.json().catch(() => null);
              throw new Error(
                failure?.error ||
                  (response.status === 413
                    ? "The upload is too large for this server. Try a smaller file."
                    : "Upload failed. Please try again.")
              );
            }
            const uploaded: UploadedFile = await response.json();
            validateAttachment(
              uploaded,
              process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
            );
            onUpload(uploaded);
          } catch (error) {
            if (!controller.current.signal.aborted) onUploadError?.(error);
          } finally {
            onClose?.();
          }
        }}
      />
      <Tooltip title="Attach image or PDF (up to 10 MB)">
        <span>
          <IconButton
            aria-label="Attach file"
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            <AttachFileIcon />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
