import baseAPI from "@/utils/config/api";
import type {
  CreateOfferBody,
  CreateOpenBuyRequestBody,
  OpenBuyRequest,
} from "@/types/request";

const requestLists = [
  { type: "Requests" as const, id: "MINE" },
  { type: "Requests" as const, id: "MARKET" },
];

const requestsApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    createOpenBuyRequest: builder.mutation<
      OpenBuyRequest,
      CreateOpenBuyRequestBody
    >({
      query: (body) => ({ url: "/requests/open", method: "POST", body }),
      invalidatesTags: requestLists,
    }),
    listMyBuyRequests: builder.query<OpenBuyRequest[], void>({
      query: () => "/requests/mine",
      providesTags: [{ type: "Requests", id: "MINE" }],
    }),
    listMarketBuyRequests: builder.query<OpenBuyRequest[], void>({
      query: () => "/requests/market",
      providesTags: [{ type: "Requests", id: "MARKET" }],
    }),
    createBuyRequestOffer: builder.mutation<
      OpenBuyRequest,
      { id: string; body: CreateOfferBody }
    >({
      query: ({ id, body }) => ({
        url: `/requests/${id}/offers`,
        method: "POST",
        body,
      }),
      invalidatesTags: requestLists,
    }),
  }),
});

export const {
  useCreateOpenBuyRequestMutation,
  useListMyBuyRequestsQuery,
  useListMarketBuyRequestsQuery,
  useCreateBuyRequestOfferMutation,
} = requestsApi;

export default requestsApi;
