import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Entry } from '@/lib/types';

export function useEntries(adventureId: string) {
  return useQuery<Entry[]>({
    queryKey: ['entries', adventureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('session_number', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!adventureId,
  });
}

export function useEntry(entryId: string | undefined) {
  return useQuery<Entry>({
    queryKey: ['entry', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', entryId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!entryId,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { adventure_id: string; title: string; session_number?: number; session_date_start?: string; session_date_end?: string; story_content?: string }) => {
      const { data, error } = await supabase.from('entries').insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['entries', data.adventure_id] });
    },
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Entry> & { id: string }) => {
      const { data, error } = await supabase.from('entries').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['entries', data.adventure_id] });
      qc.invalidateQueries({ queryKey: ['entry', data.id] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adventureId }: { id: string; adventureId: string }) => {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
      return adventureId;
    },
    onSuccess: (adventureId) => {
      qc.invalidateQueries({ queryKey: ['entries', adventureId] });
    },
  });
}
