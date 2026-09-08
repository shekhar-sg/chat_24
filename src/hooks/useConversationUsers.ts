"use client";

import { useEffect, useMemo, useState } from "react";

import { getUsersByIds, type FirestoreUserWithId } from "@/lib/firestore/users";
import type { FirestoreConversation } from "@/types/firestore";

interface UseConversationUsersResult {
  usersById: Map<string, FirestoreUserWithId>;
  loading: boolean;
  error: Error | null;
}

export function useConversationUsers(
  conversations: FirestoreConversation[],
  currentUserId: string | null | undefined
): UseConversationUsersResult {
  const [usersById, setUsersById] = useState<Map<string, FirestoreUserWithId>>(
    new Map()
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const participantIds = useMemo(() => {
    if (!currentUserId) {
      return [];
    }

    return [
      ...new Set(
        conversations.flatMap((conversation) => conversation.participantIds)
      ),
    ].filter((uid) => uid !== currentUserId);
  }, [conversations, currentUserId]);

  useEffect(() => {
    if (participantIds.length === 0) {
      setLoading(false);
      setError(null);
      return;
    }

    const missingUserIds = participantIds.filter((uid) => !usersById.has(uid));

    if (missingUserIds.length === 0) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadMissingUsers() {
      setLoading(true);
      setError(null);

      try {
        const users = await getUsersByIds(missingUserIds);

        if (cancelled) {
          return;
        }

        setUsersById((current) => {
          const next = new Map(current);

          for (const user of users) {
            next.set(user.id, user);
          }

          return next;
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error
            : new Error("Failed to load conversation users.")
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMissingUsers();

    return () => {
      cancelled = true;
    };
  }, [participantIds, usersById]);

  return {
    usersById,
    loading,
    error,
  };
}
