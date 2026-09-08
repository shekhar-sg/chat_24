import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

import type { FirestoreMessage } from "@/types/firestore";

interface Message extends FirestoreMessage {
  id: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const formatMessageTime = (createdAt: FirestoreMessage["createdAt"]) => {
  if (!createdAt) {
    return "";
  }

  return new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

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
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            from={msg.senderId}
            message={msg.text}
            time={formatMessageTime(msg.createdAt)}
            isMe={msg.senderId === currentUserId}
          />
        ))
      )}
      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
