"use client";

import ChatToolbar from "@/components/ChatToolbar";
import { useAppSelector } from "@/store/hooks";
import {
  getOrCreateDirectConversation,
  sendMessage,
  subscribeToMessages,
} from "@/firebase/chat";
import { Box, Divider, LinearProgress, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import type { Message } from "@/types/chat";
import { useGetUsersQuery } from "@/store/api/userApi";

interface ConversationProps {
  userID: string;
}

const Conversation = ({ userID }: ConversationProps) => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery(
    currentUser?.uid ?? "",
    {
      skip: !currentUser?.uid,
    }
  );

  const selectedUser = users.find((user) => user.uid === userID);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!currentUser || !userID) return;

    let unsubscribe: (() => void) | undefined;

    const initializeConversation = async () => {
      try {
        const id = await getOrCreateDirectConversation(currentUser.uid, userID);

        setConversationId(id);

        unsubscribe = subscribeToMessages(id, setMessages);
      } catch (error) {
        console.error("Failed to initialize conversation:", error);
      }
    };

    initializeConversation();

    return () => {
      unsubscribe?.();
    };
  }, [currentUser, userID]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !conversationId) return;

    try {
      await sendMessage(conversationId, currentUser.uid, text);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (usersLoading) {
    return <LinearProgress variant={"indeterminate"}/>;
  }

  if (!selectedUser) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.default",
      }}
    >
      <ChatToolbar userName={selectedUser.name} />

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
        <MessageList messages={messages} />

        <MessageInput onSend={handleSendMessage} />
      </Stack>
    </Box>
  );
};

export default Conversation;
