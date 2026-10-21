"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

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
        px: 2,
        py: 4,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          border: 1,
          borderColor: "divider",
          borderRadius: 4,
          bgcolor: "background.paper",
          boxShadow: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                bgcolor: "action.selected",
                color: "text.primary",
              }}
            >
              <LockOutlinedIcon />
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700}>
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
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                fullWidth
                slotProps={{
                  htmlInput: {
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
                size="large"
                disabled={!ready || loading}
                fullWidth
                sx={{
                  minHeight: 48,
                  borderRadius: 2.5,
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
