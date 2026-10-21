import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import type { FirestoreUser } from "@/types/firestore";
import { baseApi } from "./baseApi";

const MAX_IDS_PER_QUERY = 30;

export interface UserWithId extends FirestoreUser {
  id: string;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<
      { users: UserWithId[]; hasMore: boolean },
      { excludedUserId: string; pageSize: number }
    >({
      async queryFn({ excludedUserId, pageSize }) {
        try {
          const usersQuery = query(
            collection(db, "users"),
            orderBy("displayName"),
            limit(pageSize + 1)
          );

          const snapshot = await getDocs(usersQuery);

          const users = snapshot.docs
            .map((userDoc) => ({
              id: userDoc.id,
              ...(userDoc.data() as FirestoreUser),
            }))
            .filter((user) => user.id !== excludedUserId);

          return {
            data: { users, hasMore: snapshot.size === pageSize + 1 },
          };
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load users."),
          };
        }
      },

      providesTags: (result) =>
        result
          ? [
              {
                type: "User",
                id: "LIST",
              },
              ...result.users.map((user) => ({
                type: "User" as const,
                id: user.id,
              })),
            ]
          : [
              {
                type: "User",
                id: "LIST",
              },
            ],
    }),

    getUsersByIds: build.query<UserWithId[], string>({
      async queryFn(userIdsKey) {
        const userIds = userIdsKey
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        const uniqueUserIds = [...new Set(userIds)];

        if (uniqueUserIds.length === 0) {
          return {
            data: [],
          };
        }

        try {
          const users: UserWithId[] = [];

          for (
            let start = 0;
            start < uniqueUserIds.length;
            start += MAX_IDS_PER_QUERY
          ) {
            const chunk = uniqueUserIds.slice(start, start + MAX_IDS_PER_QUERY);

            const usersQuery = query(
              collection(db, "users"),
              where(documentId(), "in", chunk)
            );

            const snapshot = await getDocs(usersQuery);

            snapshot.docs.forEach((userDoc) => {
              users.push({
                id: userDoc.id,
                ...(userDoc.data() as FirestoreUser),
              });
            });
          }

          return {
            data: users,
          };
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load users."),
          };
        }
      },

      providesTags: (result) =>
        result
          ? result.map((user) => ({
              type: "User" as const,
              id: user.id,
            }))
          : [],
    }),
  }),
});

export const { useGetUsersQuery, useGetUsersByIdsQuery } = usersApi;
