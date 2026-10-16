import baseAPI from "@/utils/config/api";
import type {
  AssignRoleRequest,
  RoleMutationResponse,
  RoleRecord,
  UpdateUserRoleRequest,
} from "@/types/user";

const rolesApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    listRoles: builder.query<RoleRecord[], void>({
      query: () => "/roles",
      providesTags: [{ type: "Roles", id: "LIST" }],
    }),
    createRole: builder.mutation<
      RoleRecord,
      { name: string; description?: string }
    >({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
    assignRole: builder.mutation<RoleMutationResponse, AssignRoleRequest>({
      query: (body) => ({
        url: "/roles/assign-role",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Users", id: "LIST" },
        { type: "Roles", id: "LIST" },
      ],
    }),
    updateUserRole: builder.mutation<
      RoleMutationResponse,
      UpdateUserRoleRequest
    >({
      query: (body) => ({
        url: "/roles/update-user-role",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
  }),
});

export const {
  useListRolesQuery,
  useCreateRoleMutation,
  useAssignRoleMutation,
  useUpdateUserRoleMutation,
} = rolesApi;

export default rolesApi;
