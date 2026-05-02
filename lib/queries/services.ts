"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Service, UUID } from "@/lib/domain/types";
import { customerKeys } from "./customers";
import { hoursToX2 } from "@/lib/domain/pricing";

export const serviceKeys = {
  all: ["services"] as const,
  recent: (limit: number) => ["services", { recent: limit }] as const,
  byCustomer: (customerId: UUID) => ["services", { customerId }] as const,
};

export type ServiceWithTool = Service & {
  tool_name: string;
  // Set when this service has been settled by a payment allocation.
  // null/undefined means unsettled. For the service-linked payment flow, the
  // presence of an allocation is what marks a service as "paid", regardless
  // of whether allocated_paise equals total_paise (shortfall = discount).
  allocated_paise?: number | null;
};

export function useRecentServices(limit = 50) {
  return useQuery({
    queryKey: serviceKeys.recent(limit),
    queryFn: async (): Promise<Array<ServiceWithTool & { customer_name: string }>> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .select("*, tools(name), customers(name)")
        .order("service_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      type Row = Service & { tools: { name: string } | null; customers: { name: string } | null };
      return ((data ?? []) as Row[]).map((s) => ({
        ...s,
        tool_name: s.tools?.name ?? "—",
        customer_name: s.customers?.name ?? "—",
      }));
    },
  });
}

export function useCustomerServices(customerId: UUID | undefined) {
  return useQuery({
    queryKey: customerId ? serviceKeys.byCustomer(customerId) : ["services", "noop"],
    enabled: Boolean(customerId),
    queryFn: async (): Promise<ServiceWithTool[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .select("*, tools(name), payment_allocations(allocated_paise)")
        .eq("customer_id", customerId!)
        .order("service_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      type Row = Service & {
        tools: { name: string } | null;
        payment_allocations: Array<{ allocated_paise: number }> | null;
      };
      return ((data ?? []) as Row[]).map(({ payment_allocations, ...s }) => ({
        ...s,
        tool_name: s.tools?.name ?? "—",
        allocated_paise: payment_allocations?.[0]?.allocated_paise ?? null,
      }));
    },
  });
}

export type NewService = {
  customer_id: UUID;
  tool_id: UUID;
  hours: number; // in 0.5 increments
  rate_paise_per_hour: number;
  service_date: string; // YYYY-MM-DD
  notes?: string;
};

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewService): Promise<Service> => {
      const supabase = createClient();
      const hours_x2 = hoursToX2(input.hours);
      const { data, error } = await supabase
        .from("services")
        .insert({
          customer_id: input.customer_id,
          tool_id: input.tool_id,
          hours_x2,
          rate_paise_per_hour: input.rate_paise_per_hour,
          service_date: input.service_date,
          notes: input.notes?.trim() || null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.balances });
      qc.invalidateQueries({ queryKey: serviceKeys.byCustomer(variables.customer_id) });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: UUID; customer_id: UUID }) => {
      const supabase = createClient();
      const { error } = await supabase.from("services").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.balances });
      qc.invalidateQueries({ queryKey: serviceKeys.byCustomer(variables.customer_id) });
    },
  });
}
