"use client";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatToolbar from "@/components/ChatToolbar";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import TypingIndicator from "@/components/TypingIndicator";
import {
  markConversationAsRead,
  sendFileMessage,
  sendTextMessage,
  setUserTyping,
} from "@/lib/firebase/firestore/conversations";
import { useGetConversationQuery } from "@/store/api/conversationsApi";
import { useGetMessagesQuery } from "@/store/api/messagesApi";
import { useGetUsersByIdsQuery } from "@/store/api/usersApi";
import { useAppSelector } from "@/store/hooks";
import type { UploadedFile } from "@/components/FileUpoadButton";

export default function Conversation({
  conversationId,
}: {
  conversationId: string;
}) {
  const currentUserId = useAppSelector((state) => state.auth.user?.uid);
  const [pageSize, setPageSize] = useState(100);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [online, setOnline] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const conversationQuery = useGetConversationQuery(
    conversationId,
    Boolean(currentUserId)
  );
  const conversation = conversationQuery.data;
  const authorized = Boolean(
    currentUserId && conversation?.participantIds.includes(currentUserId)
  );
  const messageQuery = useGetMessagesQuery(
    conversationId,
    authorized,
    pageSize
  );
  const messages = messageQuery.data;
  const otherUserId = conversation?.participantIds.find(
    (uid) => uid !== currentUserId
  );
  const profileQuery = useGetUsersByIdsQuery(otherUserId || "", {
    skip: !otherUserId,
  });
  const otherUser = profileQuery.data?.[0];
  const loading = conversationQuery.isLoading || messageQuery.isLoading;
  const failed =
    conversationQuery.isError || messageQuery.isError || profileQuery.isError;
  const latestMessage = messages[messages.length - 1];
  const latestTime = latestMessage?.createdAt;
  const readTime = currentUserId ? conversation?.readAt[currentUserId] : null;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);
  const typing = Boolean(
    otherUserId &&
      conversation?.typing[otherUserId] &&
      now - (conversation.typingAt?.[otherUserId] ?? 0) < 6000
  );

  const handleTypingChange = useCallback(
    (value: boolean) => {
      if (!currentUserId || !authorized) return;
      void setUserTyping(conversationId, currentUserId, value).catch(() => {});
    },
    [conversationId, currentUserId, authorized]
  );

  useEffect(() => {
    if (
      !currentUserId ||
      !authorized ||
      !latestTime ||
      latestMessage?.senderId === currentUserId ||
      (readTime != null && latestTime <= readTime)
    )
      return;
    const markRead = () => {
      if (document.visibilityState === "visible")
        void markConversationAsRead(conversationId, currentUserId).catch(() =>
          setNotice("Unable to update read status. Check your connection.")
        );
    };
    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [
    currentUserId,
    authorized,
    latestTime,
    latestMessage?.senderId,
    readTime,
    conversationId,
  ]);

  const handleSend = async (text: string, file?: UploadedFile) => {
    if (!currentUserId || !authorized || sendingRef.current)
      throw new Error("Conversation is unavailable.");
    sendingRef.current = true;
    setSending(true);
    try {
      if (file)
        await sendFileMessage(conversationId, {
          ...file,
          senderId: currentUserId,
          caption: text,
        });
      else await sendTextMessage(conversationId, currentUserId, text);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const retry = () => {
    conversationQuery.refetch();
    messageQuery.refetch();
    if (otherUserId) void profileQuery.refetch();
  };
  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      <ChatToolbar
        user={
          otherUser || {
            id: otherUserId || "",
            displayName: "Conversation",
            email: null,
            photoURL: null,
            status: null,
          }
        }
      />
      <Divider />
      <Stack flex={1} minHeight={0} p={{ xs: 1, sm: 2 }} overflow="hidden">
        {!online && (
          <Alert severity="warning">
            You are offline. Keep this tab open; pending messages will finish
            sending when your connection returns.
          </Alert>
        )}
        {notice && (
          <Alert severity="warning" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
        {loading && !messages.length ? (
          <Stack flex={1} alignItems="center" justifyContent="center">
            <CircularProgress aria-label="Loading messages" />
          </Stack>
        ) : failed ? (
          <Stack
            flex={1}
            justifyContent="center"
            alignItems="center"
            spacing={2}
          >
            <Alert severity="error">Unable to load this conversation.</Alert>
            <Button onClick={retry}>Retry</Button>
          </Stack>
        ) : !authorized ? (
          <Stack flex={1} justifyContent="center" alignItems="center">
            <Typography>Conversation not found or unavailable.</Typography>
          </Stack>
        ) : (
          <MessageList
            conversationId={conversationId}
            messages={messages}
            currentUserId={currentUserId!}
            otherUserId={otherUserId}
            readAt={conversation?.readAt}
            hasMore={messages.length === pageSize}
            onLoadMore={() => setPageSize((value) => value + 100)}
          />
        )}
        <TypingIndicator
          active={typing && authorized && !failed}
          name={otherUser?.displayName || "Other participant"}
        />
        <MessageInput
          key={conversationId}
          conversationId={conversationId}
          onSend={handleSend}
          onTypingChange={handleTypingChange}
          disabled={!authorized || loading || failed || sending || !online}
        />
      </Stack>
    </Box>
  );
}
