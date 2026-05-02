export type UUID = string;

export type Customer = {
  id: UUID;
  owner_id: UUID;
  name: string;
  phone: string | null;
  village: string | null;
  notes: string | null;
  created_at: string;
};

export type Tool = {
  id: UUID;
  owner_id: UUID;
  name: string;
  rate_paise_per_hour: number;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type Service = {
  id: UUID;
  owner_id: UUID;
  customer_id: UUID;
  tool_id: UUID;
  service_date: string;
  hours_x2: number;
  rate_paise_per_hour: number;
  total_paise: number;
  notes: string | null;
  created_at: string;
};

export type PaymentMethod = "cash" | "upi";

export type Payment = {
  id: UUID;
  owner_id: UUID;
  customer_id: UUID;
  payment_date: string;
  amount_paise: number;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
};

export type PaymentAllocation = {
  id: UUID;
  owner_id: UUID;
  payment_id: UUID;
  service_id: UUID;
  allocated_paise: number;
  created_at: string;
};

export type ExpenseCategory = "fuel" | "maintenance" | "repair" | "other";

export type Expense = {
  id: UUID;
  owner_id: UUID;
  expense_date: string;
  category: ExpenseCategory;
  amount_paise: number;
  notes: string | null;
  created_at: string;
};

export type CustomerBalance = {
  customer_id: UUID;
  owner_id: UUID;
  name: string;
  phone: string | null;
  village: string | null;
  total_billed_paise: number;
  total_paid_paise: number;
  balance_paise: number;
  last_activity_date: string | null;
};

export type TimelineEntry =
  | ({ kind: "service" } & Service & {
      tool_name: string;
      allocated_paise?: number | null;
    })
  | ({ kind: "payment" } & Payment & { allocated_billed_paise?: number | null });
