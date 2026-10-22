"use client";

import { ArrowUpward } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { HistoryTurn } from "@/lib/ai-policy";

type Turn = HistoryTurn & { refused?: boolean };

export default function AICopilotSection() {
  const params = useParams<{ conversationId?: string }>();
  return (
    <Assistant
      key={params.conversationId || "inbox"}
      conversationId={params.conversationId}
    />
  );
}

function Assistant({ conversationId }: { conversationId?: string }) {
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns, busy]);

  const send = async (text = prompt) => {
    if (!conversationId || !text.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setDraftNotice(null);
    const history = turns
      .slice(-6)
      .map(({ role, text }) => ({ role, text: text.slice(0, 4000) }));
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, prompt: text, history }),
        signal: controller.current.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to reach the assistant.");
      setTurns((previous) => [
        ...previous,
        { role: "user", text },
        { role: "assistant", text: data.text, refused: data.refused },
      ]);
      setPrompt("");
    } catch (failure) {
      if (!controller.current?.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to reach the assistant."
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <Stack height="100%" minHeight={0} spacing={2}>
      <Box flexShrink={0}>
        <Typography variant="h6" fontWeight={650}>
          AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Summaries, reply drafts, rewriting, and translations for this
          conversation.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          Relevant message text is sent to Gemini when you ask. Review drafts
          before sending.
        </Typography>
      </Box>
      {!conversationId ? (
        <Alert severity="info">
          Open a conversation to get help with that chat.
        </Alert>
      ) : (
        <Stack direction="row" gap={1} flexWrap="wrap" flexShrink={0}>
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() =>
              void send(
                "Suggest a reply to the latest message in this conversation."
              )
            }
          >
            Suggest reply
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() => void send("Summarize this conversation.")}
          >
            Summarize chat
          </Button>
        </Stack>
      )}
      <Box
        ref={logRef}
        flex={1}
        minHeight={0}
        overflow="auto"
        role="log"
        aria-label="AI assistant responses"
        sx={{ overscrollBehaviorY: "contain", overflowWrap: "anywhere" }}
      >
        {!turns.length && (
          <Typography variant="body2" color="text.secondary" py={3}>
            Ask about a message, or start with a quick action above.
          </Typography>
        )}
        {turns.map((turn, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor:
                turn.role === "user" ? "action.hover" : "background.paper",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {turn.role === "user" ? "You" : "Gemini"}
            </Typography>
            <Typography variant="body2" whiteSpace="pre-wrap" mt={0.5}>
              {turn.text}
            </Typography>
            {turn.role === "assistant" && !turn.refused && (
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("chat:insert-draft", {
                      detail: { conversationId, text: turn.text },
                    })
                  );
                  setDraftNotice(
                    "Added to your message draft. Review it in the conversation before sending."
                  );
                }}
              >
                Insert draft
              </Button>
            )}
          </Box>
        ))}
        {busy && (
          <Stack direction="row" alignItems="center" gap={1} role="status">
            <CircularProgress size={16} />
            <Typography variant="caption">
              Working on this conversation…
            </Typography>
          </Stack>
        )}
      </Box>
      {draftNotice && (
        <Alert severity="success" onClose={() => setDraftNotice(null)}>
          {draftNotice}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Stack direction="row" alignItems="flex-end" gap={1} flexShrink={0}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          label="Ask about this chat"
          value={prompt}
          disabled={!conversationId || busy}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void send();
            }
          }}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
        <IconButton
          aria-label="Ask AI assistant"
          disabled={!conversationId || busy || !prompt.trim()}
          onClick={() => void send()}
          sx={{ mb: 1 }}
        >
          <ArrowUpward />
        </IconButton>
      </Stack>
    </Stack>
  );
}
