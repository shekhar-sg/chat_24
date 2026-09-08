"use client";

import AISectionTabs from "@/components/AISectionTabs";
import PaperForAISection from "@/components/PaperForAISection";
import UserList from "@/components/UserList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAIChatSidebar } from "@/store/slices/appConfigSlice";
import {
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useParams, usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useGetUsersQuery } from "@/store/api/userApi";
import { getDirectConversationId } from "@/firebase/chat";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isConversationPage = pathname.startsWith("/conversation/");
  const isBelowMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isBelowLg = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const params = useParams<{ conversationId: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const conversationUserId =
    isConversationPage && typeof params.conversationId === "string"
      ? params.conversationId
      : null;
  const conversationId =
    currentUser?.uid && conversationUserId
      ? getDirectConversationId(currentUser.uid, conversationUserId)
      : null;

  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useGetUsersQuery(currentUser?.uid ?? "", {
    skip: !currentUser?.uid,
  });
  const chatUsers = users.map((user) => ({
    id: user.uid,
    name: user.name,
    avatarUrl: user.photoURL ?? undefined,
  }));

  useEffect(() => {
    if (isBelowLg) {
      console.log("Mobile view detected, toggling AI chat sidebar.");
      dispatch(toggleAIChatSidebar(false));
    }
  }, [dispatch, isBelowLg]);
  return (
    <Stack
      direction={"row"}
      height="100svh"
      width="100vw"
      overflow="hidden"
      gap={1}
      p={{
        xs: 0,
        md: 1,
      }}
      position={"relative"}
    >
      <Paper
        variant={"outlined"}
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
        <Toolbar sx={{ bgcolor: "background.default" }}>
          <Typography variant="h6" component="div" fontWeight={"bold"}>
            Your Inbox
          </Typography>
        </Toolbar>
        <UserList users={chatUsers} />
      </Paper>
      <Paper
        variant={"outlined"}
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
        variant={"outlined"}
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
        <AISectionTabs conversationId={conversationId} />{" "}
      </PaperForAISection>
    </Stack>
  );
}
