"use client";
import { useAppSelector } from "@/store/hooks";
import { useMemo } from "react";
import { collection, query, orderBy, limitToLast } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { messageFromDoc } from "@/lib/firebase/serializers";
import { useFirestore } from "@/hooks/useFirestore";

export function useGetMessagesQuery(
  conversationId: string,
  enabled: boolean,
  pageSize = 100
) {
  const uid = useAppSelector((state) => state.auth.user?.uid);
  const source = useMemo(
    () =>
      enabled && uid
        ? query(
            collection(db, "conversations", conversationId, "messages"),
            orderBy("createdAt", "asc"),
            limitToLast(pageSize)
          )
        : null,
    [conversationId, enabled, pageSize, uid]
  );
  return useFirestore(source, messageFromDoc, `${uid}:${conversationId}`);
}
