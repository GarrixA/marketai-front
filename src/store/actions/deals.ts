import baseAPI from "@/utils/config/api";
import type {
  AdminDeal,
  ApiDeal,
  ConfirmDealRequest,
  CreateDealRequest,
  LogisticsIncome,
  PayDealRequest,
  QuoteTransportRequest,
  RequestTransportRequest,
} from "@/types/deal";

const productLists = [
  { type: "Products" as const, id: "MINE" },
  { type: "Products" as const, id: "AVAILABLE" },
  { type: "Products" as const, id: "ALL" },
  { type: "Products" as const, id: "SELL_REQUESTS" },
];

const dealLists = [
  { type: "Deals" as const, id: "MINE" },
  { type: "Deals" as const, id: "INCOMING" },
  { type: "Deals" as const, id: "ALL" },
  { type: "Deals" as const, id: "TRANSPORT" },
  { type: "Deals" as const, id: "INCOME" },
];

/** Keep open deal screens in step with the other party after payment. */
export const liveDealListOptions = {
  pollingInterval: 8_000,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
} as const;

function upsertDeal(draft: ApiDeal[], deal: ApiDeal) {
  const index = draft.findIndex((row) => row.id === deal.id);
  if (index >= 0) draft[index] = deal;
  else draft.unshift(deal);
}

const dealsApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    createDeal: builder.mutation<ApiDeal, CreateDealRequest>({
      query: (body) => ({ url: "/deals", method: "POST", body }),
      invalidatesTags: [...dealLists, ...productLists],
    }),
    listMyDeals: builder.query<ApiDeal[], void>({
      query: () => "/deals/mine",
      providesTags: [{ type: "Deals", id: "MINE" }],
    }),
    listIncomingDeals: builder.query<ApiDeal[], void>({
      query: () => "/deals/incoming",
      providesTags: [{ type: "Deals", id: "INCOMING" }],
    }),
    listAllDeals: builder.query<AdminDeal[], void>({
      query: () => "/deals",
      providesTags: [{ type: "Deals", id: "ALL" }],
    }),
    listTransportDeals: builder.query<ApiDeal[], void>({
      query: () => "/deals/transport",
      providesTags: [{ type: "Deals", id: "TRANSPORT" }],
    }),
    listLogisticsIncome: builder.query<LogisticsIncome, void>({
      query: () => "/deals/income",
      providesTags: [{ type: "Deals", id: "INCOME" }],
    }),
    confirmDeal: builder.mutation<
      ApiDeal,
      { id: string; body: ConfirmDealRequest }
    >({
      query: ({ id, body }) => ({
        url: `/deals/${id}/confirm`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [...dealLists, ...productLists],
    }),
    payDeal: builder.mutation<ApiDeal, { id: string; body: PayDealRequest }>({
      query: ({ id, body }) => ({
        url: `/deals/${id}/pay`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          try {
            dispatch(
              dealsApi.util.updateQueryData(
                "listMyDeals",
                undefined,
                (draft) => {
                  upsertDeal(draft, data);
                }
              )
            );
          } catch {
            // Buyer list is not cached yet; invalidation will load it.
          }
          try {
            dispatch(
              dealsApi.util.updateQueryData(
                "listIncomingDeals",
                undefined,
                (draft) => {
                  const index = draft.findIndex((row) => row.id === data.id);
                  if (index >= 0) draft[index] = data;
                }
              )
            );
          } catch {
            // Seller list is not cached yet; invalidation will load it.
          }
        } catch {
          // Failed payment leaves the lists unchanged.
        }
      },
      invalidatesTags: [
        ...dealLists,
        { type: "Products", id: "MINE" },
        { type: "Products", id: "AVAILABLE" },
        { type: "Products", id: "ALL" },
        { type: "Products", id: "SELL_REQUESTS" },
      ],
    }),
    requestTransport: builder.mutation<
      ApiDeal,
      { id: string; body: RequestTransportRequest }
    >({
      query: ({ id, body }) => ({
        url: `/deals/${id}/transport`,
        method: "POST",
        body,
      }),
      invalidatesTags: dealLists,
    }),
    quoteTransport: builder.mutation<
      ApiDeal,
      { id: string; body: QuoteTransportRequest }
    >({
      query: ({ id, body }) => ({
        url: `/deals/${id}/transport/quote`,
        method: "POST",
        body,
      }),
      invalidatesTags: dealLists,
    }),
    acceptOfferedTransport: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/transport/accept`,
        method: "POST",
      }),
      invalidatesTags: dealLists,
    }),
    confirmTransport: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/transport/confirm`,
        method: "POST",
      }),
      invalidatesTags: dealLists,
    }),
    requestPackaging: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/transport/packaging`,
        method: "POST",
      }),
      invalidatesTags: dealLists,
    }),
    confirmPackaging: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/transport/packaging/confirm`,
        method: "POST",
      }),
      invalidatesTags: dealLists,
    }),
    requestDeliveryConfirmation: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/transport/delivery-request`,
        method: "POST",
      }),
      invalidatesTags: dealLists,
    }),
    confirmDelivery: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/transport/delivery-confirm`,
        method: "POST",
      }),
      invalidatesTags: dealLists,
    }),
    rejectDeal: builder.mutation<ApiDeal, string>({
      query: (id) => ({
        url: `/deals/${id}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: [...dealLists, ...productLists],
    }),
  }),
});

export const {
  useCreateDealMutation,
  useListMyDealsQuery,
  useListIncomingDealsQuery,
  useListAllDealsQuery,
  useListTransportDealsQuery,
  useListLogisticsIncomeQuery,
  useConfirmDealMutation,
  usePayDealMutation,
  useRequestTransportMutation,
  useQuoteTransportMutation,
  useAcceptOfferedTransportMutation,
  useConfirmTransportMutation,
  useRequestPackagingMutation,
  useConfirmPackagingMutation,
  useRequestDeliveryConfirmationMutation,
  useConfirmDeliveryMutation,
  useRejectDealMutation,
} = dealsApi;

export default dealsApi;
