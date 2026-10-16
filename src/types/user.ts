import type { UserStatus } from "@/types/auth";

export type ListedUser = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
};

export type CreateUserRequest = {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type AssignRoleRequest = {
  userId: string;
  role: string;
};

export type UpdateUserRoleRequest = {
  userId: string;
  currentRole: string;
  newRole: string;
};

export type RoleMutationResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
    emailVerifiedAt: string | null;
    roles: string[];
  };
};
