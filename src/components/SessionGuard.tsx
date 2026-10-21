"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Stack, CircularProgress } from "@mui/material";
import { useAppSelector } from "@/store/hooks";
import { signOutUser } from "@/lib/firebase/auth";
import { clearServerSession } from "@/lib/firebase/session-client";

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, initialized } = useAppSelector((state) => state.auth);
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!initialized) return;
    let active = true;
    setError(false);
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (!response.ok && response.status !== 401) throw new Error();
        const session = response.ok ? await response.json() : null;
        if (!active) return;
        if (!user || session?.uid !== user.uid) {
          await clearServerSession();
          if (!active) return;
          await signOutUser();
          if (!active) return;
          window.location.replace("/login");
          return;
        }
        setVerifiedUid(user.uid);
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid, initialized, attempt, user]);
  if (error)
    return (
      <Stack m={3} spacing={2}>
        <Alert severity="error">Unable to verify your session.</Alert>
        <Button onClick={() => setAttempt((value) => value + 1)}>Retry</Button>
      </Stack>
    );
  if (!user || verifiedUid !== user.uid)
    return (
      <Stack minHeight="100dvh" alignItems="center" justifyContent="center">
        <CircularProgress aria-label="Verifying session" />
      </Stack>
    );
  return children;
}
