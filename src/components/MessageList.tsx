"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
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
  conversationId: string;
  otherUserId?: string;
  hasMore: boolean;
  onLoadMore: () => void;
  readAt?: Record<string, number | null>;
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

const MessageList = (props: MessageListProps) => {
  const {
    messages,
    currentUserId,
    readAt,
    otherUserId,
    conversationId,
    hasMore,
    onLoadMore,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const previousLastId = useRef<string | undefined>(undefined);
  const previousHeight = useRef<number | null>(null);
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
    const container = containerRef.current;
    if (container && previousHeight.current !== null) {
      container.scrollTop += container.scrollHeight - previousHeight.current;
      previousHeight.current = null;
    } else if (previousLastId.current !== messages.at(-1)?.id) {
      const nearBottom =
        !container ||
        container.scrollHeight - container.scrollTop - container.clientHeight <
          180;
      if (
        !previousLastId.current ||
        nearBottom ||
        messages.at(-1)?.senderId === currentUserId
      )
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    previousLastId.current = messages.at(-1)?.id;
  }, [messages, currentUserId]);

  const otherUserReadAt = otherUserId ? (readAt?.[otherUserId] ?? null) : null;

  const isMessageSeen = (message: Message) => {
    return (
      message.senderId === currentUserId &&
      otherUserReadAt !== null &&
      message.createdAt !== null &&
      message.createdAt <= otherUserReadAt
    );
  };

  return (
    <>
      <Box
        ref={containerRef}
        role="log"
        aria-label="Messages"
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
        {hasMore && (
          <Button
            onClick={() => {
              previousHeight.current =
                containerRef.current?.scrollHeight ?? null;
              onLoadMore();
            }}
          >
            Load older messages
          </Button>
        )}
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
                      message={message.caption}
                      time={formatMessageTime(message.createdAt)}
                      isMe={isMe}
                      seen={isMessageSeen(message)}
                      file={{
                        fileName: message.fileName,
                        fileUrl: message.fileUrl,
                        fileSize: message.fileSize,
                        contentType: message.contentType,
                      }}
                      onFileClick={(file) =>
                        setSelectedFile({ ...file, messageId: message.id })
                      }
                    />
                  ) : (
                    <MessageBubble
                      message={message.text}
                      time={formatMessageTime(message.createdAt)}
                      isMe={isMe}
                      seen={isMessageSeen(message)}
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
        conversationId={conversationId}
        file={selectedFile}
        open={Boolean(selectedFile)}
        onClose={() => setSelectedFile(null)}
      />
    </>
  );
};

export default MessageList;
