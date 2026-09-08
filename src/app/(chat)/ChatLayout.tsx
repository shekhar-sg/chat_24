"use client";

import { Add } from "@mui/icons-material";
import {
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { usePathname } from "next/navigation";
import {type ReactNode, useEffect, useMemo, useState } from "react";

import AISectionTabs from "@/components/AISectionTabs";
import NewConversation from "@/components/NewConversation";
import PaperForAISection from "@/components/PaperForAISection";
import UserList from "@/components/UserList";
import { useGetConversationsQuery } from "@/store/api/conversationsApi";
import { useGetUsersByIdsQuery } from "@/store/api/usersApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAIChatSidebar } from "@/store/slices/appConfigSlice";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isConversationPage = pathname.startsWith("/conversation/");
  const isBelowMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isBelowLg = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);

  const [newConversationOpen, setNewConversationOpen] = useState(false);

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
  } = useGetConversationsQuery(authUser?.uid ?? skipToken);

  const participantIds = useMemo(() => {
    if (!authUser?.uid) {
      return [];
    }

    return [
      ...new Set(
        conversations.flatMap((conversation) => conversation.participantIds)
      ),
    ].filter((uid) => uid !== authUser.uid);
  }, [conversations, authUser?.uid]);

  const { data: participantUsers = [] } = useGetUsersByIdsQuery(
    participantIds.join(","),
    {
      skip: participantIds.length === 0,
    }
  );

  const usersById = useMemo(() => {
    return new Map(participantUsers.map((user) => [user.id, user]));
  }, [participantUsers]);

  const users = useMemo(() => {
    return conversations.flatMap((conversation) => {
      const otherUserId = conversation.participantIds.find(
        (uid) => uid !== authUser?.uid
      );

      if (!otherUserId) {
        return [];
      }

      const profile = usersById.get(otherUserId);

      if (!profile) {
        return [];
      }

      const lastMessage = conversation.lastMessage;

      return [
        {
          id: otherUserId,
          conversationId: conversation.id,
          name: profile.displayName || profile.email || "Unknown user",
          avatarUrl: profile.photoURL || undefined,
          status: profile.status || undefined,
          isGroup: false,
          unreadCount: 0,
          conversation: lastMessage
            ? [
                {
                  from: lastMessage.senderId,
                  message: lastMessage.text,
                  time: conversation.lastMessageAt
                    ? conversation.lastMessageAt
                        .toDate()
                        .toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                    : "",
                },
              ]
            : [],
        },
      ];
    });
  }, [authUser?.uid, conversations, usersById]);

  useEffect(() => {
    if (isBelowLg) {
      dispatch(toggleAIChatSidebar(false));
    }
  }, [dispatch, isBelowLg]);

  return (
    <>
      <Stack
        direction="row"
        height="100svh"
        width="100vw"
        overflow="hidden"
        gap={1}
        p={{
          xs: 0,
          md: 1,
        }}
        position="relative"
      >
        <Paper
          variant="outlined"
          sx={{
            width: {
              xs: "100%",
              md: 400,
            },
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
            display:
              isBelowMd && !isConversationPage
                ? "flex"
                : !isBelowMd
                  ? "flex"
                  : "none",
            flexDirection: "column",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.1)",
          }}
        >
          <Toolbar
            sx={{
              bgcolor: "background.default",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" component="div" fontWeight="bold">
              Your Inbox
            </Typography>

            <IconButton
              size="small"
              onClick={() => setNewConversationOpen(true)}
              aria-label="Start new conversation"
            >
              <Add />
            </IconButton>
          </Toolbar>

          {conversationsLoading ? (
            <Stack flex={1} alignItems="center" justifyContent="center">
              <Typography color="text.secondary">
                Loading conversations...
              </Typography>
            </Stack>
          ) : conversationsError ? (
            <Stack flex={1} alignItems="center" justifyContent="center">
              <Typography color="error">
                Failed to load conversations.
              </Typography>
            </Stack>
          ) : (
            <UserList users={users} />
          )}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            border: 1,
            borderColor: "divider",
            overflowY: "auto",
            display: isBelowMd && !isConversationPage ? "none" : "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          {children}
        </Paper>

        <PaperForAISection
          variant="outlined"
          sx={{
            width: {
              xs: "100%",
              md: 440,
            },
            border: 1,
            borderColor: "divider",
            overflowY: "auto",
            flexDirection: "column",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.1)",
          }}
        >
          <AISectionTabs />
        </PaperForAISection>
      </Stack>

      <NewConversation
        open={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
      />
    </>
  );
}
