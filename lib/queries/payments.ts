"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Payment, PaymentMethod, Service, UUID } from "@/lib/domain/types";
import { customerKeys } from "./customers";
import { serviceKeys, type ServiceWithTool } from "./services";

export const paymentKeys = {
  all: ["payments"] as const,
  byCustomer: (customerId: UUID) => ["payments", { customerId }] as const,
  recent: (limit: number) => ["payments", { recent: limit }] as const,
  unpaidServices: (customerId: UUID) =>
    ["payments", "unpaidServices", { customerId }] as const,
};

export type PaymentWithAllocations = Payment & {
  // Sum of total_paise of services this payment settled. Null when this is a legacy
  // customer-level payment with no allocations — running-balance UI then falls back
  // to subtracting amount_paise.
  allocated_billed_paise: number | null;
};

export function useCustomerPayments(customerId: UUID | undefined) {
  return useQuery({
    queryKey: customerId ? paymentKeys.byCustomer(customerId) : ["payments", "noop"],
    enabled: Boolean(customerId),
    queryFn: async (): Promise<PaymentWithAllocations[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payments")
        .select("*, payment_allocations(allocated_paise, services(total_paise))")
        .eq("customer_id", customerId!)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      type Row = Payment & {
        payment_allocations:
          | Array<{ allocated_paise: number; services: { total_paise: number } | null }>
          | null;
      };
      return ((data ?? []) as Row[]).map(({ payment_allocations, ...rest }) => {
        const allocs = payment_allocations ?? [];
        return {
          ...rest,
          allocated_billed_paise:
            allocs.length > 0
              ? allocs.reduce((sum, a) => sum + (a.services?.total_paise ?? 0), 0)
              : null,
        };
      });
    },
  });
}

// Services for a customer that have NOT been settled by any allocation.
export function useUnpaidServices(customerId: UUID | undefined) {
  return useQuery({
    queryKey: customerId
      ? paymentKeys.unpaidServices(customerId)
      : ["payments", "unpaidServices", "noop"],
    enabled: Boolean(customerId),
    queryFn: async (): Promise<ServiceWithTool[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .select("*, tools(name), payment_allocations(id)")
        .eq("customer_id", customerId!)
        .order("service_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      type Row = Service & {
        tools: { name: string } | null;
        payment_allocations: Array<{ id: UUID }> | null;
      };
      return ((data ?? []) as Row[])
        .filter((s) => !s.payment_allocations || s.payment_allocations.length === 0)
        .map((s) => ({
          ...s,
          tool_name: s.tools?.name ?? "—",
        }));
    },
  });
}

export function useRecentPayments(limit = 30) {
  return useQuery({
    queryKey: paymentKeys.recent(limit),
    queryFn: async (): Promise<Array<Payment & { customer_name: string }>> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payments")
        .select("*, customers(name)")
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      type Row = Payment & { customers: { name: string } | null };
      return ((data ?? []) as Row[]).map((p) => ({
        ...p,
        customer_name: p.customers?.name ?? "—",
      }));
    },
  });
}

export type PaymentAllocationInput = {
  service_id: UUID;
  allocated_paise: number;
};

export type NewPayment = {
  customer_id: UUID;
  method: PaymentMethod;
  payment_date: string;
  notes?: string;
  allocations: PaymentAllocationInput[];
};

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPayment): Promise<Payment> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("record_payment_with_allocations", {
        p_customer_id: input.customer_id,
        p_payment_date: input.payment_date,
        p_method: input.method,
        p_notes: input.notes?.trim() ?? "",
        p_allocations: input.allocations,
      });
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.balances });
      qc.invalidateQueries({ queryKey: paymentKeys.byCustomer(variables.customer_id) });
      qc.invalidateQueries({
        queryKey: paymentKeys.unpaidServices(variables.customer_id),
      });
      qc.invalidateQueries({ queryKey: serviceKeys.byCustomer(variables.customer_id) });
      qc.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: UUID; customer_id: UUID }) => {
      const supabase = createClient();
      const { error } = await supabase.from("payments").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.balances });
      qc.invalidateQueries({ queryKey: paymentKeys.byCustomer(variables.customer_id) });
      qc.invalidateQueries({
        queryKey: paymentKeys.unpaidServices(variables.customer_id),
      });
      qc.invalidateQueries({ queryKey: serviceKeys.byCustomer(variables.customer_id) });
      qc.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}
