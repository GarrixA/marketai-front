import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearSession } from "@/lib/session";
import { getAuthToken } from "@/store/helpers/authTokens";
import { API_TAGS } from "@/store/helpers/tags";
import { clearToken } from "@/store/reducer/app";
import { BASE_API_URL } from "@/utils/config/keys";

interface AppReducer {
  token?: string;
}

interface RootState {
  appReducer?: AppReducer;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    const { appReducer } = getState() as RootState;
    const token = getAuthToken(appReducer?.token, endpoint);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Leave Content-Type unset for FormData so the browser sets the boundary.
    return headers;
  },
});

const baseQueryWithAuth: typeof rawBaseQuery = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && api.endpoint !== "logout") {
    clearSession();
    api.dispatch(clearToken());
    void fetch(`${BASE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/dashboard")
    ) {
      window.location.href = "/";
    }
  }

  return result;
};

const baseAPI = createApi({
  reducerPath: "baseAPI",
  baseQuery: baseQueryWithAuth,
  tagTypes: [...API_TAGS],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

export default baseAPI;
