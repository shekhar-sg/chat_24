"use client";
import { InsertEmoticonRounded, Close } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import FileUploadButton, {
  type UploadedFile,
} from "@/components/FileUpoadButton";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat";
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function MessageInput({
  conversationId,
  onSend,
  disabled = false,
  onTypingChange,
}: {
  conversationId: string;
  onSend: (text: string, file?: UploadedFile) => Promise<void>;
  disabled?: boolean;
  onTypingChange?: (typing: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingWrite = useRef(0);
  useEffect(() => {
    const insert = (event: Event) => {
      const { conversationId: targetId, text } = (
        event as CustomEvent<{ conversationId: string; text: string }>
      ).detail;
      if (targetId !== conversationId || typeof text !== "string") return;
      setMessage((previous) =>
        (previous ? `${previous}\n${text}` : text).slice(0, MAX_MESSAGE_LENGTH)
      );
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener("chat:insert-draft", insert);
    return () => window.removeEventListener("chat:insert-draft", insert);
  }, [conversationId]);
  const busy = disabled || uploading || sending;
  useEffect(() => {
    const stop = () => {
      if (document.visibilityState === "hidden") {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        onTypingChange?.(false);
        lastTypingWrite.current = 0;
      }
    };
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, [onTypingChange]);
  const changeMessage = (value: string) => {
    setMessage(value);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (!value.trim()) {
      onTypingChange?.(false);
      lastTypingWrite.current = 0;
      return;
    }
    if (Date.now() - lastTypingWrite.current > 2000) {
      onTypingChange?.(true);
      lastTypingWrite.current = Date.now();
    }
    typingTimer.current = setTimeout(() => {
      onTypingChange?.(false);
      lastTypingWrite.current = 0;
    }, 1500);
  };
  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      onTypingChange?.(false);
    },
    [onTypingChange]
  );
  const send = async () => {
    if (busy || sendingRef.current || (!message.trim() && !file)) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    onTypingChange?.(false);
    lastTypingWrite.current = 0;
    try {
      await onSend(message.trim(), file || undefined);
      setMessage("");
      setFile(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      setError(
        "Message could not be sent. Your draft is saved here; try again."
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: "divider",
        pt: 1,
        pb: "env(safe-area-inset-bottom)",
        flexShrink: 0,
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <TextField
        fullWidth
        multiline
        maxRows={4}
        label="Message"
        placeholder="Type a message..."
        inputRef={inputRef}
        value={message}
        disabled={busy}
        onChange={(event) => changeMessage(event.target.value)}
        onBlur={() => {
          if (typingTimer.current) clearTimeout(typingTimer.current);
          onTypingChange?.(false);
          lastTypingWrite.current = 0;
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            void send();
          }
        }}
        slotProps={{ htmlInput: { maxLength: MAX_MESSAGE_LENGTH } }}
      />
      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
        <FileUploadButton
          conversationId={conversationId}
          disabled={busy}
          onUpload={setFile}
          onUploadStart={() => {
            setError(null);
            setUploading(true);
          }}
          onUploadError={() =>
            setError(
              "Upload failed. Choose an image or PDF up to 10 MB and try again."
            )
          }
          onClose={() => setUploading(false)}
        />
        <IconButton
          aria-label="Choose emoji"
          disabled={busy}
          onClick={(event) => setEmojiAnchor(event.currentTarget)}
        >
          <InsertEmoticonRounded />
        </IconButton>
        <Popover
          open={Boolean(emojiAnchor)}
          anchorEl={emojiAnchor}
          onClose={() => setEmojiAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <EmojiPicker
            width={300}
            onEmojiClick={(emoji) => {
              changeMessage(
                (message + emoji.emoji).slice(0, MAX_MESSAGE_LENGTH)
              );
              setEmojiAnchor(null);
              inputRef.current?.focus();
            }}
          />
        </Popover>
        <Box flex={1} />
        <Button
          variant="contained"
          disabled={busy || (!message.trim() && !file)}
          onClick={() => void send()}
        >
          {uploading ? "Uploading..." : sending ? "Sending..." : "Send"}
        </Button>
      </Stack>
      {file && (
        <Stack direction="row" alignItems="center" mt={1} gap={1}>
          <Typography variant="body2" noWrap>
            {file.fileName}
          </Typography>
          <IconButton
            aria-label="Remove attachment"
            size="small"
            disabled={busy}
            onClick={() => setFile(null)}
          >
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Box>
  );
}
