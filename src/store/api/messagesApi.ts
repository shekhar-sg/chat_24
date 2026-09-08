import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type FirestoreError,
} from "firebase/firestore";

import { baseApi } from "./baseApi";
import { db } from "@/lib/firestore";
import type { FirestoreMessage } from "@/types/firestore";

const MESSAGE_LIMIT = 100;

export interface MessageWithId extends FirestoreMessage {
  id: string;
}

export const messagesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMessages: build.query<MessageWithId[], string>({
      queryFn: () => ({
        data: [],
      }),

      async onCacheEntryAdded(
        conversationId,
        { updateCachedData, cacheEntryRemoved }
      ) {
        const messagesRef = collection(
          db,
          "conversations",
          conversationId,
          "messages"
        );

        const messagesQuery = query(
          messagesRef,
          orderBy("createdAt", "asc"),
          limit(MESSAGE_LIMIT)
        );

        let unsubscribe: (() => void) | undefined;

        try {
          unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
              const messages = snapshot.docs.map((messageDoc) => ({
                id: messageDoc.id,
                ...(messageDoc.data() as FirestoreMessage),
              }));

              updateCachedData((draft) => {
                draft.length = 0;
                draft.push(...messages);
              });
            },
            (error: FirestoreError) => {
              console.error("Message listener error:", error);
            }
          );
        } catch (error) {
          console.error("Failed to subscribe to messages:", error);
        }

        await cacheEntryRemoved;

        unsubscribe?.();
      },

      providesTags: (result, _error, conversationId) =>
        result
          ? [
              {
                type: "Message",
                id: `LIST-${conversationId}`,
              },
              ...result.map((message) => ({
                type: "Message" as const,
                id: message.id,
              })),
            ]
          : [
              {
                type: "Message",
                id: `LIST-${conversationId}`,
              },
            ],
    }),
  }),
});

export const { useGetMessagesQuery } = messagesApi;
