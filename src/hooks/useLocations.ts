import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Location } from '@/lib/types';

export function useLocations(adventureId: string) {
  return useQuery<Location[]>({
    queryKey: ['locations', adventureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!adventureId,
  });
}
