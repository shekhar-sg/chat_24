import { ArrowUpward } from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { type KeyboardEvent, useRef, useState, useEffect } from "react";

const AICopilotSection = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! How can I assist you today?" },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: message },
      { sender: "ai", text: getAIResponse(message) },
    ]);
    setMessage("");
    inputRef.current?.focus();
  };

  function getAIResponse(userMsg: string) {
    if (userMsg.toLowerCase().includes("hello")) return "Hi there!";
    if (userMsg.toLowerCase().includes("ai")) return "I'm your AI Copilot!";
    if (userMsg.toLowerCase().includes("help")) return "How can I help you?";
    return "I'm here to assist you.";
  }

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
        <Typography variant={"h2"} gutterBottom>
          Copilot demo
        </Typography>
        <Typography variant={"body1"}>
          This is an interactive UI demo with canned replies. No AI provider is
          connected, and messages are not saved.
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1 }}>
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
                bgcolor:
                  msg.sender === "user" ? "primary.main" : "action.hover",
                color:
                  msg.sender === "user"
                    ? "primary.contrastText"
                    : "text.primary",
                px: 2,
                py: 1,
                borderRadius: 2,
                maxWidth: "70%",
                wordBreak: "break-word", // Ensures long words break to next line
                overflowWrap: "break-word", // Fallback for extra-long words
              }}
            >
              <Typography variant="body2">{msg.text}</Typography>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ mt: "auto", pt: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask a follow-up question..."
          inputRef={inputRef}
          value={message}
          onKeyDown={handleInputKeyDown}
          onChange={(e) => setMessage(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position={"end"}>
                  <IconButton
                    color="primary"
                    size="small"
                    aria-label="Send demo message"
                    disabled={!message.trim()}
                    onClick={() => {
                      handleSend();
                    }}
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
