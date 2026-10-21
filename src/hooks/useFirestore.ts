"use client";
import { useEffect, useState, useCallback } from "react";
import {
  onSnapshot,
  type DocumentReference,
  type Query,
  type DocumentData,
} from "firebase/firestore";

// Key state by source so an account/route change cannot expose stale data.
export function useFirestore<T>(
  source: Query<DocumentData> | DocumentReference<DocumentData> | null,
  decode: (id: string, data: DocumentData) => T,
  scope: unknown = source
) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    scope: unknown;
    data: T[];
    status: "loading" | "ready" | "error";
    error: string | null;
  }>({ scope: null, data: [], status: "loading", error: null });
  useEffect(() => {
    if (!source) return;
    let active = true;
    setState((previous) => ({
      scope,
      data: previous.scope === scope ? previous.data : [],
      status: "loading",
      error: null,
    }));
    const fail = () => {
      if (active)
        setState({
          scope,
          data: [],
          status: "error",
          error: "Unable to load data. Check your connection and try again.",
        });
    };
    try {
      const unsubscribe =
        source.type === "document"
          ? onSnapshot(
              source,
              (snapshot) => {
                if (active)
                  setState({
                    scope,
                    data: snapshot.exists()
                      ? [decode(snapshot.id, snapshot.data())]
                      : [],
                    status: "ready",
                    error: null,
                  });
              },
              fail
            )
          : onSnapshot(
              source,
              (snapshot) => {
                if (active)
                  setState({
                    scope,
                    data: snapshot.docs.map((doc) =>
                      decode(doc.id, doc.data())
                    ),
                    status: "ready",
                    error: null,
                  });
              },
              fail
            );
      return () => {
        active = false;
        unsubscribe();
      };
    } catch {
      fail();
    }
  }, [source, decode, attempt, scope]);
  const current =
    state.scope === scope
      ? state
      : { data: [], status: "loading", error: null };
  const refetch = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    data: source ? current.data : [],
    isLoading: Boolean(source && current.status === "loading"),
    isError: Boolean(source && current.status === "error"),
    error: current.error,
    refetch,
  };
}
