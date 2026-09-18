"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

import ChatToolbar from "@/components/ChatToolbar";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import {
  markConversationAsRead,
  sendFileMessage,
  sendTextMessage,
} from "@/lib/firebase/firestore/conversations";
import { useGetConversationsQuery } from "@/store/api/conversationsApi";
import { useGetMessagesQuery } from "@/store/api/messagesApi";
import { useGetUsersByIdsQuery } from "@/store/api/usersApi";
import { useAppSelector } from "@/store/hooks";

interface ConversationProps {
  conversationId: string;
}

export interface FileMessagePayload {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
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

  const otherUserId = conversation?.participantIds.find(
    (uid) => uid !== currentUserId
  );

  const { data: participantUsers = [], isLoading: participantLoading } =
    useGetUsersByIdsQuery(otherUserId ?? "", {
      skip: !otherUserId,
    });

  const otherUser = participantUsers[0];

  const loading = conversationsLoading || messagesLoading || participantLoading;

  const error = conversationsError || messagesError;

  useEffect(() => {
    if (!currentUserId || !conversation) {
      return;
    }

    const latestMessage = messages[messages.length - 1];

    if (!latestMessage) {
      return;
    }

    // Only mark the conversation as read when the latest message
    // was sent by the other participant.
    if (latestMessage.senderId === currentUserId) {
      return;
    }

    void markConversationAsRead(conversationId, currentUserId).catch(
      (error) => {
        console.error("Failed to mark conversation as read:", error);
      }
    );
  }, [conversationId, currentUserId, conversation, messages]);

  if (!currentUserId) {
    return null;
  }

  const handleSend = async (message: string, file?: FileMessagePayload) => {
    if (sending) return;

    setSending(true);

    try {
      if (file) {
        await sendFileMessage(conversationId, {
          senderId: currentUserId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          contentType: file.contentType,
        });

        return;
      }

      await sendTextMessage(conversationId, currentUserId, message);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    } finally {
      setSending(false);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      {otherUser ? (
        <ChatToolbar user={otherUser} />
      ) : (
        <ChatToolbar
          user={{
            id: "",
            displayName: "Conversation",
            email: null,
            photoURL: null,
            status: null,
          }}
        />
      )}

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
          <MessageList messages={messages} currentUserId={currentUserId} readAt={conversation.readAt}/>
        )}

        <MessageInput onSend={handleSend} />
      </Stack>
    </Box>
  );
};

export default Conversation;
