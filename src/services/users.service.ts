import usersApi from "@/store/actions/users";
import { rtkMutation, rtkQuery } from "@/store/helpers/rtkDispatch";
import type { CreateUserRequest, ListedUser } from "@/types/user";

const endpoints = usersApi.endpoints;

export const usersService = {
  listUsers(): Promise<ListedUser[]> {
    return rtkQuery<ListedUser[]>(endpoints.listUsers, undefined, {
      forceRefetch: true,
    });
  },

  getUserById(id: string): Promise<ListedUser> {
    return rtkQuery<ListedUser>(endpoints.getUserById, id, {
      forceRefetch: true,
    });
  },

  createUser(payload: CreateUserRequest): Promise<ListedUser> {
    return rtkMutation<ListedUser>(endpoints.createUser, payload);
  },
};
