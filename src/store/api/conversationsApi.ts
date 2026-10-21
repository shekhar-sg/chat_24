"use client";
import { useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { conversationFromDoc } from "@/lib/firebase/serializers";
import { useFirestore } from "@/hooks/useFirestore";

export function useGetConversationsQuery(
  uid: string | undefined,
  pageSize = 30
) {
  const source = useMemo(
    () =>
      uid
        ? query(
            collection(db, "conversations"),
            where("participantIds", "array-contains", uid),
            orderBy("lastMessageAt", "desc"),
            limit(pageSize)
          )
        : null,
    [uid, pageSize]
  );
  return useFirestore(source, conversationFromDoc, uid);
}

export function useGetConversationQuery(id: string, enabled: boolean) {
  const source = useMemo(
    () => (enabled ? doc(db, "conversations", id) : null),
    [id, enabled]
  );
  const result = useFirestore(source, conversationFromDoc);
  return { ...result, data: result.data[0] };
}
