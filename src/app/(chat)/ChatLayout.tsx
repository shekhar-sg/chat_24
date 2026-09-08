"use client";

import AISectionTabs from "@/components/AISectionTabs";
import PaperForAISection from "@/components/PaperForAISection";
import UserList from "@/components/UserList";
import { users } from "@/content/users";
import { useAppDispatch } from "@/store/hooks";
import { toggleAIChatSidebar } from "@/store/slices/appConfigSlice";
import {
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isConversationPage = pathname.startsWith("/conversation/");
  const isBelowMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isBelowLg = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const dispatch = useAppDispatch();
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
        <UserList users={users} />
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
        <AISectionTabs />
      </PaperForAISection>
    </Stack>
  );
}
