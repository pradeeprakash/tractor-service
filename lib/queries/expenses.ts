"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Expense, ExpenseCategory } from "@/lib/domain/types";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (limit: number) => ["expenses", { limit }] as const,
};

export function useExpenses(limit = 50) {
  return useQuery({
    queryKey: expenseKeys.list(limit),
    queryFn: async (): Promise<Expense[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type NewExpense = {
  category: ExpenseCategory;
  amount_paise: number;
  expense_date: string;
  notes?: string;
};

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewExpense): Promise<Expense> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          category: input.category,
          amount_paise: input.amount_paise,
          expense_date: input.expense_date,
          notes: input.notes?.trim() || null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
