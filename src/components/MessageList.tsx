"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { Timestamp } from "firebase/firestore";
import { useAppSelector } from "@/store/hooks";
import type { Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
}

const formatMessageTime = (timestamp: Timestamp | null) => {
  if (!timestamp) return "";

  return timestamp.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageList = ({ messages }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = useAppSelector((state) => state.auth.user?.uid);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        pt: 3,
        pb: 2,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        scrollbarWidth: "none",
      }}
    >
      {messages.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          No messages yet. Start the conversation!
        </Typography>
      ) : (
        messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;

          return (
            <MessageBubble
              key={msg.id}
              from={isMe ? "Me" : msg.senderId}
              message={msg.text}
              time={formatMessageTime(msg.createdAt)}
              isMe={isMe}
            />
          );
        })
      )}

      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
