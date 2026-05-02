"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Customer, CustomerBalance, UUID } from "@/lib/domain/types";

export const customerKeys = {
  all: ["customers"] as const,
  list: (search: string) => ["customers", { search }] as const,
  detail: (id: UUID) => ["customers", id] as const,
  balances: ["customer_balances"] as const,
};

export function useCustomers(search = "") {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: async (): Promise<Customer[]> => {
      const supabase = createClient();
      let q = supabase.from("customers").select("*").order("name");
      if (search.trim()) {
        const t = `%${search.trim()}%`;
        q = q.or(`name.ilike.${t},phone.ilike.${t},village.ilike.${t}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomer(id: UUID | undefined) {
  return useQuery({
    queryKey: id ? customerKeys.detail(id) : ["customer", "noop"],
    enabled: Boolean(id),
    queryFn: async (): Promise<Customer | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useCustomerBalances() {
  return useQuery({
    queryKey: customerKeys.balances,
    queryFn: async (): Promise<CustomerBalance[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customer_balances")
        .select("*")
        .order("balance_paise", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOwingCustomers(search = "") {
  return useQuery({
    queryKey: ["customer_balances", "owing", { search }] as const,
    queryFn: async (): Promise<CustomerBalance[]> => {
      const supabase = createClient();
      let q = supabase
        .from("customer_balances")
        .select("*")
        .gt("balance_paise", 0)
        .order("balance_paise", { ascending: false });
      if (search.trim()) {
        const t = `%${search.trim()}%`;
        q = q.or(`name.ilike.${t},phone.ilike.${t},village.ilike.${t}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomerBalance(customerId: UUID | undefined) {
  return useQuery({
    queryKey: customerId ? ["customer_balances", customerId] : ["customer_balances", "noop"],
    enabled: Boolean(customerId),
    queryFn: async (): Promise<CustomerBalance | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customer_balances")
        .select("*")
        .eq("customer_id", customerId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export type NewCustomer = Pick<Customer, "name"> &
  Partial<Pick<Customer, "phone" | "village" | "notes">>;

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCustomer): Promise<Customer> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          village: input.village?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.balances });
    },
  });
}
