import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreError,
} from "firebase/firestore";

import { db } from "@/lib/firestore";
import { baseApi } from "./baseApi";
import type { FirestoreConversation } from "@/types/firestore";

const CONVERSATION_LIMIT = 30;

export const conversationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getConversations: build.query<FirestoreConversation[], string>({
      queryFn: () => ({
        data: [],
      }),

      async onCacheEntryAdded(uid, { updateCachedData, cacheEntryRemoved }) {
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participantIds", "array-contains", uid),
          orderBy("lastMessageAt", "desc"),
          limit(CONVERSATION_LIMIT)
        );

        let unsubscribe: (() => void) | undefined;

        try {
          unsubscribe = onSnapshot(
            conversationsQuery,
            (snapshot) => {
              const conversations = snapshot.docs.map((conversationDoc) => ({
                id: conversationDoc.id,
                ...conversationDoc.data(),
              })) as FirestoreConversation[];

              updateCachedData((draft) => {
                draft.length = 0;
                draft.push(...conversations);
              });
            },
            (error: FirestoreError) => {
              console.error("Conversation listener error:", error);
            }
          );
        } catch (error) {
          console.error("Failed to subscribe to conversations:", error);
        }

        await cacheEntryRemoved;

        unsubscribe?.();
      },
      providesTags: (result) =>
        result
          ? [
              { type: "Conversation", id: "LIST" },
              ...result.map((conversation) => ({
                type: "Conversation" as const,
                id: conversation.id,
              })),
            ]
          : [
              {
                type: "Conversation",
                id: "LIST",
              },
            ],
    }),
  }),
});

export const { useGetConversationsQuery } = conversationsApi;
