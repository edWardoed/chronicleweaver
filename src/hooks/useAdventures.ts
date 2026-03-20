import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Adventure } from '@/lib/types';

export function useAdventures() {
  return useQuery<Adventure[]>({
    queryKey: ['adventures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adventures')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAdventure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adventure: { title: string; description?: string; cover_image_url?: string }) => {
      const { data, error } = await supabase
        .from('adventures')
        .insert(adventure)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adventures'] }),
  });
}

export function useDeleteAdventure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('adventures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adventures'] }),
  });
}

export async function uploadCoverImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('adventure-images')
    .upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('adventure-images').getPublicUrl(fileName);
  return data.publicUrl;
}
