"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ChatBubbleOutlineRounded,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
} from "@/lib/firebase/auth";

import { updateProfile } from "firebase/auth";
import {
  createServerSession,
  clearServerSession,
} from "@/lib/firebase/session-client";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

const authCopy = {
  login: {
    title: "Welcome back",
    description: "Sign in to continue to your conversations.",
    submit: "Sign in",
    switchText: "Don't have an account?",
    switchLabel: "Create one",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    description: "Get started with your conversations.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/login",
  },
} satisfies Record<AuthMode, object>;

export default function AuthForm({ mode }: AuthFormProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = authCopy[mode];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const credential =
        mode === "login"
          ? await signInWithEmail(email.trim(), password)
          : await signUpWithEmail(email.trim(), password);

      if (mode === "signup")
        await updateProfile(credential.user, {
          displayName: displayName.trim(),
        });
      await createServerSession(credential.user);
      const profileResponse = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName:
            credential.user.displayName || email.trim().split("@")[0],
        }),
      });
      if (!profileResponse.ok)
        throw new Error("Profile setup failed. Please sign in to retry.");

      window.location.replace("/");
    } catch (err) {
      await clearServerSession().catch(() => {});
      await signOutUser().catch(() => {});
      console.error("Authentication error:", err);
      setError(
        mode === "login"
          ? "Unable to sign in. Please check your email and password."
          : "Unable to finish account setup. Check your details, or sign in if your account was already created."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2.5, sm: 4 },
        py: { xs: 3, sm: 6 },
        gap: { md: 10, lg: 16 },
        bgcolor: "background.default",
      }}
    >
      <Stack
        sx={{ display: { xs: "none", md: "flex" }, maxWidth: 370 }}
        spacing={3}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <ChatBubbleOutlineRounded color="secondary" />
          <Typography fontWeight={700} letterSpacing={-0.5}>
            Agent Chat
          </Typography>
        </Stack>
        <Typography
          component="p"
          sx={{
            fontSize: { md: 40, lg: 46 },
            fontWeight: 650,
            lineHeight: 1.15,
            letterSpacing: "-1.5px",
          }}
        >
          Good conversations.
          <br />
          Clear connections.
        </Typography>
        <Typography color="text.secondary" lineHeight={1.7}>
          A focused space for your messages, shared files, and a little help
          finding the right words.
        </Typography>
        <Divider sx={{ width: 48 }} />
        <Typography variant="body2" color="text.secondary">
          Your next conversation starts here.
        </Typography>
      </Stack>
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 2.5, sm: 4.5 },
          border: { xs: 0, sm: 1 },
          borderColor: "divider",
          borderRadius: "16px",
          bgcolor: "background.paper",
          boxShadow: { xs: "none", sm: "0 8px 32px rgba(15,23,42,0.04)" },
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={3} alignItems="flex-start" textAlign="left">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "secondary.main",
              }}
            >
              <ChatBubbleOutlineRounded fontSize="small" />
              <Typography fontSize={14} fontWeight={700} color="text.primary">
                Agent Chat
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h5"
                component="h1"
                fontWeight={650}
                letterSpacing={-0.6}
              >
                {copy.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                {copy.description}
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {mode === "signup" && (
                <TextField
                  label="Display name"
                  disabled={!ready || loading}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 80 } }}
                />
              )}
              <TextField
                label="Email"
                disabled={!ready || loading}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                fullWidth
              />

              <TextField
                label="Password"
                disabled={!ready || loading}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          disabled={loading}
                          onClick={() => setShowPassword((value) => !value)}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOffOutlined fontSize="small" />
                          ) : (
                            <VisibilityOutlined fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                  htmlInput: {
                    "aria-label": "Password",
                    minLength: mode === "signup" ? 8 : undefined,
                    maxLength: 128,
                  },
                }}
                helperText={
                  mode === "signup" ? "Use at least 8 characters." : undefined
                }
              />

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                disabled={!ready || loading}
                fullWidth
                sx={{
                  minHeight: 48,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  copy.submit
                )}
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Typography variant="body2" color="text.secondary" textAlign="center">
            {copy.switchText}{" "}
            <Typography
              component={Link}
              href={copy.switchHref}
              variant="body2"
              color="text.primary"
              fontWeight={600}
              sx={{
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {copy.switchLabel}
            </Typography>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
