"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import FilePreviewDialog, { type PreviewFile } from "./FilePreviewDialog";
import MessageBubble from "./MessageBubble";
import type { FirestoreMessage } from "@/types/firestore";

type Message = FirestoreMessage & {
  id: string;
};

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const getMessageDate = (createdAt: FirestoreMessage["createdAt"]) => {
  if (!createdAt) {
    return null;
  }

  return new Date(createdAt);
};

const formatMessageTime = (createdAt: FirestoreMessage["createdAt"]) => {
  const date = getMessageDate(createdAt);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getDateKey = (createdAt: FirestoreMessage["createdAt"]) => {
  const date = getMessageDate(createdAt);

  if (!date) {
    return "";
  }

  return [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
};

const formatDateLabel = (createdAt: FirestoreMessage["createdAt"]) => {
  const date = getMessageDate(createdAt);

  if (!date) {
    return "";
  }

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const messageStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const difference = todayStart.getTime() - messageStart.getTime();

  const oneDay = 24 * 60 * 60 * 1000;

  if (difference === 0) {
    return "Today";
  }

  if (difference === oneDay) {
    return "Yesterday";
  }

  if (difference > 0 && difference < 7 * oneDay) {
    return date.toLocaleDateString([], {
      weekday: "long",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<PreviewFile | null>(null);

  const groupedMessages = useMemo(() => {
    let previousDateKey: string | null = null;

    return messages.map((message) => {
      const dateKey = getDateKey(message.createdAt);
      const showDateSeparator = dateKey !== previousDateKey;

      previousDateKey = dateKey;

      return {
        message,
        showDateSeparator,
      };
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          pt: 2,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          scrollbarWidth: "none",

          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {messages.length === 0 ? (
          <Stack flex={1} alignItems="center" justifyContent="center" px={3}>
            <Typography color="text.secondary" textAlign="center" fontSize={14}>
              No messages yet.
            </Typography>

            <Typography
              color="text.disabled"
              textAlign="center"
              fontSize={13}
              mt={0.5}
            >
              Start the conversation!
            </Typography>
          </Stack>
        ) : (
          <Stack gap={0}>
            {groupedMessages.map(({ message, showDateSeparator }) => {
              const isMe = message.senderId === currentUserId;

              return (
                <Box key={message.id}>
                  {showDateSeparator && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 2,
                      }}
                    >
                      <Chip
                        label={formatDateLabel(message.createdAt)}
                        size="small"
                        sx={{
                          height: 28,
                          px: 0.5,
                          bgcolor: "action.hover",
                          color: "text.secondary",
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 999,
                          "& .MuiChip-label": {
                            px: 1.5,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {message.type === "file" ? (
                    <MessageBubble
                      time={formatMessageTime(message.createdAt)}
                      isMe={isMe}
                      file={{
                        fileName: message.fileName,
                        fileUrl: message.fileUrl,
                        fileSize: message.fileSize,
                        contentType: message.contentType,
                      }}
                      onFileClick={setSelectedFile}
                    />
                  ) : (
                    <MessageBubble
                      message={message.text}
                      time={formatMessageTime(message.createdAt)}
                      isMe={isMe}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}

        <div ref={bottomRef} />
      </Box>

      <FilePreviewDialog
        file={selectedFile}
        open={Boolean(selectedFile)}
        onClose={() => setSelectedFile(null)}
      />
    </>
  );
};

export default MessageList;
