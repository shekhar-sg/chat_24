"use client";
import { Box } from "@mui/material";

export default function TypingIndicator({
  active,
  name,
}: {
  active: boolean;
  name: string;
}) {
  return (
    <Box
      sx={{
        height: 32,
        flexShrink: 0,
        px: 1,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        role="status"
        aria-live="polite"
        aria-label={active ? `${name} is typing` : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          px: 1.5,
          py: 1,
          borderRadius: "12px 12px 12px 4px",
          bgcolor: "action.hover",
          visibility: active ? "visible" : "hidden",
          "@keyframes typingPulse": {
            "0%, 60%, 100%": { opacity: 0.4, transform: "translateY(0)" },
            "30%": { opacity: 1, transform: "translateY(-3px)" },
          },
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            aria-hidden
            sx={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              bgcolor: "text.secondary",
              animation: "typingPulse 1.2s infinite",
              animationDelay: `${index * 0.15}s`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
