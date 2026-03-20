import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LocationRow {
  id: string;
  adventure_id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  description: string | null;
  notes: string | null;
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
      return data;
    },
    enabled: !!adventureId,
  });
}
