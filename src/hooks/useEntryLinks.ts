import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEntryCharacters(entryId: string | undefined) {
  return useQuery<string[]>({
    queryKey: ['entry-characters', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entry_characters')
        .select('character_id')
        .eq('entry_id', entryId!);
      if (error) throw error;
      return data.map((d) => d.character_id);
    },
    enabled: !!entryId,
  });
}

export function useLinkCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, characterId }: { entryId: string; characterId: string }) => {
      const { error } = await supabase.from('entry_characters').insert({ entry_id: entryId, character_id: characterId });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['entry-characters', v.entryId] }),
  });
}

export function useUnlinkCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, characterId }: { entryId: string; characterId: string }) => {
      const { error } = await supabase.from('entry_characters').delete().eq('entry_id', entryId).eq('character_id', characterId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['entry-characters', v.entryId] }),
  });
}

export function useEntryLocations(entryId: string | undefined) {
  return useQuery<string[]>({
    queryKey: ['entry-locations', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entry_locations')
        .select('location_id')
        .eq('entry_id', entryId!);
      if (error) throw error;
      return data.map((d) => d.location_id);
    },
    enabled: !!entryId,
  });
}

export function useLinkLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, locationId }: { entryId: string; locationId: string }) => {
      const { error } = await supabase.from('entry_locations').insert({ entry_id: entryId, location_id: locationId });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['entry-locations', v.entryId] }),
  });
}

export function useUnlinkLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, locationId }: { entryId: string; locationId: string }) => {
      const { error } = await supabase.from('entry_locations').delete().eq('entry_id', entryId).eq('location_id', locationId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['entry-locations', v.entryId] }),
  });
}
