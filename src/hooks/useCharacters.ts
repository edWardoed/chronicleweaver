import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Character } from '@/lib/types';

export function useCharacters(adventureId: string) {
  return useQuery<Character[]>({
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
