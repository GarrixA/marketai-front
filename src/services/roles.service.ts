import rolesApi from "@/store/actions/roles";
import { rtkMutation, rtkQuery } from "@/store/helpers/rtkDispatch";
import type {
  AssignRoleRequest,
  RoleMutationResponse,
  RoleRecord,
  UpdateUserRoleRequest,
} from "@/types/user";

const endpoints = rolesApi.endpoints;

export const rolesService = {
  listRoles(): Promise<RoleRecord[]> {
    return rtkQuery<RoleRecord[]>(endpoints.listRoles, undefined, {
      forceRefetch: true,
    });
  },

  createRole(name: string, description?: string): Promise<RoleRecord> {
    return rtkMutation<RoleRecord>(endpoints.createRole, {
      name,
      description,
    });
  },

  assignRole(payload: AssignRoleRequest): Promise<RoleMutationResponse> {
    return rtkMutation<RoleMutationResponse>(endpoints.assignRole, payload);
  },

  updateUserRole(
    payload: UpdateUserRoleRequest
  ): Promise<RoleMutationResponse> {
    return rtkMutation<RoleMutationResponse>(endpoints.updateUserRole, payload);
  },
};
