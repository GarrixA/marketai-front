import baseAPI from "@/utils/config/api";
import type {
  CreateSupportTicketRequest,
  SupportTicket,
  UpdateSupportTicketRequest,
} from "@/types/support";

const supportApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    createSupportTicket: builder.mutation<
      SupportTicket,
      CreateSupportTicketRequest
    >({
      query: (body) => ({ url: "/support/tickets", method: "POST", body }),
      invalidatesTags: [
        { type: "Support", id: "MINE" },
        { type: "Support", id: "LIST" },
      ],
    }),
    listMySupportTickets: builder.query<SupportTicket[], void>({
      query: () => "/support/tickets/mine",
      providesTags: [{ type: "Support", id: "MINE" }],
    }),
    listSupportTickets: builder.query<SupportTicket[], void>({
      query: () => "/support/tickets",
      providesTags: [{ type: "Support", id: "LIST" }],
    }),
    updateSupportTicket: builder.mutation<
      SupportTicket,
      { id: string; body: UpdateSupportTicketRequest }
    >({
      query: ({ id, body }) => ({
        url: `/support/tickets/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Support", id: "LIST" }],
    }),
  }),
});

export const {
  useCreateSupportTicketMutation,
  useListMySupportTicketsQuery,
  useListSupportTicketsQuery,
  useUpdateSupportTicketMutation,
} = supportApi;

export default supportApi;
