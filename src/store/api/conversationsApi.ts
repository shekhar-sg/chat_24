import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreError,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { baseApi } from "./baseApi";
import type { FirestoreConversation } from "@/types/firestore";
import { timestampToMillis } from "@/utils/helpers";

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
              const conversations: FirestoreConversation[] = snapshot.docs.map(
                (conversationDoc) => {
                  const data = conversationDoc.data();
                  const lastMessage = data.lastMessage;

                  return {
                    id: conversationDoc.id,
                    type: data.type,
                    participantIds: data.participantIds,
                    lastMessage: lastMessage
                      ? {
                          type: lastMessage.type,
                          text: lastMessage.text,
                          senderId: lastMessage.senderId,
                          createdAt:
                            timestampToMillis(lastMessage.createdAt) ??
                            Date.now(),
                          fileName: lastMessage.fileName,
                        }
                      : null,

                    lastMessageAt: timestampToMillis(data.lastMessageAt),
                    readAt: Object.fromEntries(
                      Object.entries(data.readAt ?? {}).map(
                        ([userId, timestamp]) => [
                          userId,
                          timestampToMillis(
                            timestamp as Timestamp | null | undefined
                          ),
                        ]
                      )
                    ),
                    typing: (data.typing ?? {}) as Record<string, boolean>,
                    createdAt: timestampToMillis(data.createdAt) ?? Date.now(),
                  };
                }
              );

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
