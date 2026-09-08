"use client";

import { useEffect, useState } from "react";

import { subscribeToUserConversations } from "@/lib/firestore/conversations";
import type { FirestoreConversation } from "@/types/firestore";

interface UseConversationsResult {
  conversations: FirestoreConversation[];
  loading: boolean;
  error: Error | null;
}

export function useConversations(
  uid: string | null | undefined
): UseConversationsResult {
  const [conversations, setConversations] = useState<FirestoreConversation[]>(
    []
  );
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setConversations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    return subscribeToUserConversations(
      uid,
      (nextConversations) => {
        setConversations(nextConversations);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError);
        setLoading(false);
      }
    );
  }, [uid]);

  return {
    conversations,
    loading,
    error,
  };
}
