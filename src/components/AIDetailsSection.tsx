import { Alert, Stack, Typography } from "@mui/material";
export default function AIDetailsSection() {
  return (
    <Stack spacing={2}>
      <Typography variant="h2">About this demo</Typography>
      <Alert severity="info">No AI model is connected.</Alert>
      <Typography>
        The Copilot tab demonstrates a chat interface using a few predefined
        replies. It does not understand conversation history, learn from
        messages, or send messages to an AI service.
      </Typography>
      <Typography>
        Demo messages remain in browser memory and reset when this panel is
        remounted.
      </Typography>
    </Stack>
  );
}
