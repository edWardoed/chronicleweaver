import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CharacterRow {
  id: string;
  adventure_id: string;
  name: string;
  type: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCharacters(adventureId: string) {
  return useQuery<CharacterRow[]>({
    queryKey: ['characters', adventureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!adventureId,
  });
}
