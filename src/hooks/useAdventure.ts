import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Adventure } from '@/lib/types';

export function useAdventure(id: string | undefined) {
  return useQuery<Adventure>({
    queryKey: ['adventure', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('adventures').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateAdventure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Adventure> & { id: string }) => {
      const { data, error } = await supabase.from('adventures').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['adventure', data.id] });
      qc.invalidateQueries({ queryKey: ['adventures'] });
    },
  });
}
