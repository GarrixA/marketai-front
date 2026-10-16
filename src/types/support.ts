export type SupportTicketCategory =
  | "LOCATION_MISMATCH"
  | "ADDRESS_HELP"
  | "ACCOUNT_HELP"
  | "ORDER_HELP"
  | "OTHER";

export type SupportTicketStatus =
  "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  userId: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  context: Record<string, unknown> | null;
  status: SupportTicketStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportTicketRequest = {
  category: SupportTicketCategory;
  subject: string;
  message: string;
  context?: Record<string, unknown>;
};

export type UpdateSupportTicketRequest = {
  status?: SupportTicketStatus;
  adminNotes?: string | null;
};

export const SUPPORT_CATEGORY_OPTIONS: {
  value: SupportTicketCategory;
  label: string;
}[] = [
  { value: "LOCATION_MISMATCH", label: "Location / coordinates mismatch" },
  { value: "ADDRESS_HELP", label: "Delivery address help" },
  { value: "ACCOUNT_HELP", label: "Account help" },
  { value: "ORDER_HELP", label: "Order / buying help" },
  { value: "OTHER", label: "Other" },
];
