"use client";

import { Box, Typography } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

import { useAppSelector } from "@/store/hooks";

export default function ChatPage() {
  const { user, loading, initialized } = useAppSelector((state) => state.auth);

  return (
    <Box
      flex={1}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      minHeight={0}
      sx={{ bgcolor: "background.default" }}
    >
      <ChatBubbleOutlineIcon
        sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
      />

      <Typography
        variant="h5"
        color="text.secondary"
        fontWeight={500}
        gutterBottom
      >
        No conversation selected
      </Typography>

      <Typography variant="body1" color="text.secondary">
        {loading
          ? "Checking authentication..."
          : initialized && user
            ? `Signed in as ${user.email}`
            : "Not signed in"}
      </Typography>
    </Box>
  );
}
