"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tool, UUID } from "@/lib/domain/types";

export const toolKeys = {
  all: ["tools"] as const,
  active: ["tools", { active: true }] as const,
  detail: (id: UUID) => ["tools", id] as const,
};

export function useTools(opts: { onlyActive?: boolean } = {}) {
  return useQuery({
    queryKey: opts.onlyActive ? toolKeys.active : toolKeys.all,
    queryFn: async (): Promise<Tool[]> => {
      const supabase = createClient();
      let q = supabase.from("tools").select("*").order("sort_order").order("name");
      if (opts.onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTool(id: UUID | undefined) {
  return useQuery({
    queryKey: id ? toolKeys.detail(id) : ["tool", "noop"],
    enabled: Boolean(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type NewTool = {
  name: string;
  rate_paise_per_hour: number;
  active?: boolean;
};

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewTool): Promise<Tool> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tools")
        .insert({
          name: input.name.trim(),
          rate_paise_per_hour: input.rate_paise_per_hour,
          active: input.active ?? true,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: toolKeys.all });
    },
  });
}

export function useUpdateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Tool> & { id: UUID }): Promise<Tool> => {
      const supabase = createClient();
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("tools")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: toolKeys.all });
    },
  });
}
