import authApi from "@/store/actions/auth";
import { rtkMutation, rtkQuery } from "@/store/helpers/rtkDispatch";
import { clearToken, setToken } from "@/store/reducer/app";
import { store } from "@/store/page";
import baseAPI from "@/utils/config/api";
import {
  clearSession,
  sessionFromLogin,
  setSession,
  type UserSession,
} from "@/lib/session";
import { formatApiError } from "@/lib/apiError";
import type {
  ChangePasswordRequest,
  ClaimRoleRequest,
  ClaimRoleResponse,
  IncompleteRegistrationError,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateMeAggregatorProfileRequest,
  UpdateMePersonalRequest,
  UpdateMeProfileRequest,
  VerifyEmailResponse,
} from "@/types/auth";

const endpoints = authApi.endpoints;

export function isIncompleteRegistration(
  error: unknown
): error is { data: IncompleteRegistrationError; status: number } {
  if (!error || typeof error !== "object") return false;
  const data = (error as { data?: IncompleteRegistrationError }).data;
  return Boolean(data?.missingAction);
}

export const authService = {
  async login(credentials: LoginRequest): Promise<UserSession> {
    const result = await rtkMutation<LoginResponse>(
      endpoints.login,
      credentials
    );
    const session = sessionFromLogin(result.accessToken, result.user);
    if (!session) {
      throw new Error(
        "Your account has no marketplace role assigned yet. Contact an administrator."
      );
    }
    setSession(session);
    store.dispatch(setToken(result.accessToken));
    return session;
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    return rtkMutation<RegisterResponse>(endpoints.register, payload);
  },

  async verifyEmail(token: string, code: string): Promise<VerifyEmailResponse> {
    return rtkMutation<VerifyEmailResponse>(endpoints.verifyEmail, {
      token,
      code,
    });
  },

  async claimRole(payload: ClaimRoleRequest): Promise<ClaimRoleResponse> {
    return rtkMutation<ClaimRoleResponse>(endpoints.claimRole, payload);
  },

  async resetPassword(
    token: string,
    payload: ResetPasswordRequest
  ): Promise<{ message: string }> {
    return rtkMutation<{ message: string }>(endpoints.resetPassword, {
      token,
      ...payload,
    });
  },

  async getMe(): Promise<MeResponse> {
    return rtkQuery<MeResponse>(endpoints.getMe, undefined, {
      forceRefetch: true,
    });
  },

  async updateMePersonal(
    payload: UpdateMePersonalRequest
  ): Promise<MeResponse> {
    return rtkMutation<MeResponse>(endpoints.updateMePersonal, payload);
  },

  async uploadMeAvatar(file: File): Promise<MeResponse> {
    const body = new FormData();
    body.append("avatar", file);
    return rtkMutation<MeResponse>(endpoints.uploadMeAvatar, body);
  },

  async updateMeProfile(payload: UpdateMeProfileRequest): Promise<MeResponse> {
    return rtkMutation<MeResponse>(endpoints.updateMeProfile, payload);
  },

  async updateMeAggregatorProfile(
    payload: UpdateMeAggregatorProfileRequest
  ): Promise<MeResponse> {
    return rtkMutation<MeResponse>(
      endpoints.updateMeAggregatorProfile,
      payload
    );
  },

  async changePassword(
    payload: ChangePasswordRequest
  ): Promise<{ message: string }> {
    return rtkMutation<{ message: string }>(endpoints.changePassword, payload);
  },

  async logout(): Promise<void> {
    try {
      await rtkMutation<{ message: string }>(endpoints.logout, undefined);
    } catch {
      // Clear local state even when the API is unreachable.
    }
    clearSession();
    store.dispatch(clearToken());
    store.dispatch(baseAPI.util.resetApiState());
  },

  formatError: formatApiError,
};
