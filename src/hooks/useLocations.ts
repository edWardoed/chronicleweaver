import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadCoverImage } from '@/hooks/useAdventures';

export interface LocationRow {
  id: string;
  adventure_id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  description: string | null;
  notes: string | null;
  dm_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useLocations(adventureId: string) {
  return useQuery<LocationRow[]>({
    queryKey: ['locations', adventureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('name');
      if (error) throw error;
      return data as unknown as LocationRow[];
    },
    enabled: !!adventureId,
  });
}

export function useLocation(id: string | undefined) {
  return useQuery<LocationRow>({
    queryKey: ['location', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as LocationRow;
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loc: { adventure_id: string; name: string; type?: string }) => {
      const { data, error } = await supabase.from('locations').insert(loc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['locations', data.adventure_id] });
    },
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('locations')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['locations', data.adventure_id] });
      qc.invalidateQueries({ queryKey: ['location', data.id] });
    },
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adventureId }: { id: string; adventureId: string }) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      return adventureId;
    },
    onSuccess: (adventureId) => {
      qc.invalidateQueries({ queryKey: ['locations', adventureId] });
    },
  });
}

export async function uploadLocationImage(file: File): Promise<string> {
  return uploadCoverImage(file);
}
