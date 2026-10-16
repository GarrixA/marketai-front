import baseAPI from "@/utils/config/api";
import type { CreateUserRequest, ListedUser } from "@/types/user";

const usersApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<ListedUser[], void>({
      query: () => "/users",
      providesTags: [{ type: "Users", id: "LIST" }],
    }),
    getUserById: builder.query<ListedUser, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    createUser: builder.mutation<ListedUser, CreateUserRequest>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
  }),
});

export const { useListUsersQuery, useGetUserByIdQuery, useCreateUserMutation } =
  usersApi;

export default usersApi;
