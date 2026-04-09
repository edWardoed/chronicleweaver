import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadCoverImage } from '@/hooks/useAdventures';

export interface CharacterRow {
  id: string;
  adventure_id: string;
  name: string;
  type: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  class: string | null;
  subclass: string | null;
  race: string | null;
  background: string | null;
  alignment: string | null;
  level: number | null;
  experience_points: number | null;
  str_score: number | null;
  dex_score: number | null;
  con_score: number | null;
  int_score: number | null;
  wis_score: number | null;
  cha_score: number | null;
  armor_class: number | null;
  initiative_override: number | null;
  speed: number | null;
  max_hp: number | null;
  current_hp: number | null;
  temp_hp: number | null;
  hit_dice: string | null;
  death_save_successes: number | null;
  death_save_failures: number | null;
  saving_throw_proficiencies: string[] | null;
  skill_proficiencies: string[] | null;
  skill_half_proficiencies: string[] | null;
  proficiencies_languages: string | null;
  equipment: EquipmentItem[] | null;
  features_traits: string | null;
  spell_slots: Record<string, { total: number; expended: number }> | null;
  spellcasting_ability: string | null;
  spells: SpellRow[] | null;
  personality_traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  role_occupation: string | null;
  attitude: string | null;
  physical_description: string | null;
  voice_mannerisms: string | null;
  story_role: string | null;
  dm_notes_visible: boolean;
  created_by: string | null;
  sw_attributes: Record<string, string> | null;
  sw_skills: { name: string; die: string }[] | null;
  sw_pace: number | null;
  sw_parry: number | null;
  sw_toughness: number | null;
  sw_wounds: number | null;
  sw_fatigue: number | null;
  sw_bennies: number | null;
  sw_rank: string | null;
  pf_proficiencies: Record<string, string> | null;
  pf_feats: { name: string; type: string; level: number; notes: string }[] | null;
  pf_hero_points: number | null;
  pf_key_ability: string | null;
  pf_heritage: string | null;
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  weight: number;
}

export interface SpellRow {
  id: string;
  prepared: boolean;
  name: string;
  level: number;
  school: string;
  concentration: boolean;
  ritual: boolean;
  notes: string;
}

export function useCharacters(adventureId: string) {
  return useQuery<CharacterRow[]>({
    queryKey: ['characters', adventureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters_safe' as any)
        .select('*')
        .eq('adventure_id', adventureId)
        .order('name');
      if (error) throw error;
      return data as unknown as CharacterRow[];
    },
    enabled: !!adventureId,
  });
}

export function useCharacter(id: string | undefined) {
  return useQuery<CharacterRow>({
    queryKey: ['character', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters_safe' as any)
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as CharacterRow;
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (char: { adventure_id: string; name: string; type: string; created_by?: string }) => {
      const { data, error } = await supabase.from('characters').insert(char).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['characters', data.adventure_id] });
    },
  });
}

export function useUpdateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['characters', data.adventure_id] });
      qc.invalidateQueries({ queryKey: ['character', data.id] });
    },
  });
}

export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adventureId }: { id: string; adventureId: string }) => {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
      return adventureId;
    },
    onSuccess: (adventureId) => {
      qc.invalidateQueries({ queryKey: ['characters', adventureId] });
    },
  });
}

export async function uploadAvatarImage(file: File): Promise<string> {
  return uploadCoverImage(file);
}
