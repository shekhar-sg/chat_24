import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUsers, type FirestoreUser } from "@/firebase/users";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getUsers: builder.query<FirestoreUser[], string>({
      async queryFn(currentUserId) {
        try {
          const users = await getUsers(currentUserId);

          return { data: users };
        } catch (error) {
          console.error("Failed to fetch users:", error);

          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                error instanceof globalThis.Error
                  ? error.message
                  : "Failed to fetch users",
            },
          };
        }
      },
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
