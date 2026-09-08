"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import ChatToolbar from "@/components/ChatToolbar";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import { sendMessage } from "@/lib/firestore/conversations";
import { useGetConversationsQuery } from "@/store/api/conversationsApi";
import { useGetMessagesQuery } from "@/store/api/messagesApi";
import { useAppSelector } from "@/store/hooks";

interface ConversationProps {
  conversationId: string;
}

const Conversation = ({ conversationId }: ConversationProps) => {
  const currentUserId = useAppSelector((state) => state.auth.user?.uid);

  const [sending, setSending] = useState(false);

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
  } = useGetConversationsQuery(currentUserId ?? skipToken);

  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useGetMessagesQuery(conversationId);

  const conversation = conversations.find((item) => item.id === conversationId);

  if (!currentUserId) {
    return null;
  }

  const handleSend = async (message: string) => {
    if (sending) {
      return;
    }

    setSending(true);

    try {
      await sendMessage(conversationId, currentUserId, message);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const loading = conversationsLoading || messagesLoading;

  const error = conversationsError || messagesError;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      <ChatToolbar userName={"Conversation"} />
      <Divider />
      <Stack
        flexGrow={1}
        p={2}
        sx={{
          height: (theme) => ({
            xs: `calc(100% - ${theme.spacing(8)})`,
            md: `calc(100vh - ${theme.spacing(10)})`,
          }),
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Stack flexGrow={1} alignItems="center" justifyContent="center">
            <CircularProgress size={28} />
          </Stack>
        ) : error ? (
          <Stack
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
            spacing={1}
          >
            <Typography color="error">Failed to load conversation.</Typography>

            <Typography variant="body2" color="text.secondary">
              Please try again.
            </Typography>
          </Stack>
        ) : !conversation ? (
          <Stack flexGrow={1} alignItems="center" justifyContent="center">
            <Typography color="text.secondary">
              Conversation not found.
            </Typography>
          </Stack>
        ) : (
          <MessageList messages={messages} currentUserId={currentUserId} />
        )}

        <MessageInput onSend={handleSend} />
      </Stack>
    </Box>
  );
};

export default Conversation;
