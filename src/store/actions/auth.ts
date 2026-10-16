import baseAPI from "@/utils/config/api";
import type {
  ChangePasswordRequest,
  ClaimRoleRequest,
  ClaimRoleResponse,
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

const authApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    verifyEmail: builder.mutation<
      VerifyEmailResponse,
      { token: string; code: string }
    >({
      query: ({ token, code }) => ({
        url: `/auth/verify-email/${encodeURIComponent(token)}`,
        method: "POST",
        body: { code },
      }),
    }),
    claimRole: builder.mutation<ClaimRoleResponse, ClaimRoleRequest>({
      query: (body) => ({
        url: "/auth/claim-role",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      { message: string },
      { token: string } & ResetPasswordRequest
    >({
      query: ({ token, ...body }) => ({
        url: `/auth/reset-password/${encodeURIComponent(token)}`,
        method: "POST",
        body,
      }),
    }),
    resendVerification: builder.mutation<RegisterResponse, { email: string }>({
      query: (body) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body,
      }),
    }),
    getMe: builder.query<MeResponse, void>({
      query: () => "/me",
      providesTags: ["Auth"],
    }),
    updateMePersonal: builder.mutation<MeResponse, UpdateMePersonalRequest>({
      query: (body) => ({
        url: "/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    uploadMeAvatar: builder.mutation<MeResponse, FormData>({
      query: (body) => ({
        url: "/me/avatar",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    updateMeProfile: builder.mutation<MeResponse, UpdateMeProfileRequest>({
      query: (body) => ({
        url: "/me/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    updateMeAggregatorProfile: builder.mutation<
      MeResponse,
      UpdateMeAggregatorProfileRequest
    >({
      query: (body) => ({
        url: "/me/aggregator-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    changePassword: builder.mutation<
      { message: string },
      ChangePasswordRequest
    >({
      query: (body) => ({
        url: "/me/password",
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useClaimRoleMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useResendVerificationMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMePersonalMutation,
  useUploadMeAvatarMutation,
  useUpdateMeProfileMutation,
  useUpdateMeAggregatorProfileMutation,
  useChangePasswordMutation,
} = authApi;

export default authApi;
