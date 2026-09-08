"use client";

import { useState } from "react";

import { Logout as LogoutIcon } from "@mui/icons-material";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";

import { signOutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  variant?: "icon" | "button";
}

export default function LogoutButton({ variant = "icon" }: LogoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClose = () => {
    if (!isSigningOut) {
      setOpen(false);
      setError(null);
    }
  };

  const handleLogout = async () => {
    if (isSigningOut) return;

    setError(null);
    setIsSigningOut(true);

    try {
      await signOutUser();

      const response = await fetch("/api/auth/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear server session.");
      }
      router.replace("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
      setError("Something went wrong while signing out. Please try again.");
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <Tooltip title="Sign out">
          <IconButton
            onClick={() => setOpen(true)}
            disabled={isSigningOut}
            aria-label="sign out"
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "error.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          disabled={isSigningOut}
          startIcon={<LogoutIcon />}
          color="error"
        >
          Sign out
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Sign out?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out of your account?
          </DialogContentText>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSigningOut} color="inherit">
            Cancel
          </Button>

          <Button
            onClick={handleLogout}
            disabled={isSigningOut}
            variant="contained"
            color={"error"}
            loading={isSigningOut}
            loadingPosition={"start"}
          >
            Sign out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
