"use client";

import { ArrowUpward } from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

interface AICopilotSectionProps {
  conversationId: string | null;
}

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface DisplayMessage {
  sender: "user" | "ai";
  text: string;
}

const AICopilotSection = ({ conversationId }: AICopilotSectionProps) => {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      sender: "ai",
      text: "Hello! How can I assist you with this conversation?",
    },
  ]);

  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) return;

    if (!conversationId) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Please open a conversation before using the AI Copilot.",
        },
      ]);

      return;
    }

    const userMessage: AIMessage = {
      role: "user",
      content: trimmedMessage,
    };

    const updatedAIHistory = [...aiMessages, userMessage];

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: trimmedMessage,
      },
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          messages: updatedAIHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      const aiText =
        data.message || "I couldn't generate a response right now.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiText,
        },
      ]);

      setAiMessages([
        ...updatedAIHistory,
        {
          role: "assistant",
          content: aiText,
        },
      ]);
    } catch (error) {
      console.error("AI request failed:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I couldn't process that request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "inline-flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h2" gutterBottom>
          AI Copilot
        </Typography>

        <Typography variant="body1">
          Get help understanding messages, writing replies, rewriting text,
          changing tone, summarizing conversations, and translating messages.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 1,
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              mb: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: msg.sender === "user" ? "primary.main" : "grey.200",

                color:
                  msg.sender === "user"
                    ? "primary.contrastText"
                    : "text.primary",

                px: 2,
                py: 1,
                borderRadius: 2,
                maxWidth: "70%",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              <Typography variant="body2">{msg.text}</Typography>
            </Box>
          </Box>
        ))}

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              mb: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: "grey.200",
                color: "text.primary",
                px: 2,
                py: 1,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">Thinking...</Typography>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ mt: "auto", pt: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask a follow-up question..."
          inputRef={inputRef}
          value={message}
          disabled={isLoading}
          onKeyDown={handleInputKeyDown}
          onChange={(e) => setMessage(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    size="small"
                    disabled={isLoading || !message.trim()}
                    onClick={handleSend}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default AICopilotSection;
