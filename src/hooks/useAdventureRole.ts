import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type AdventureRole = 'dm' | 'scribe' | 'player' | null;

/** Get a single adventure's role for routing decisions */
export function useAdventureRole(adventureId: string | undefined) {
  const { user, isAdmin } = useAuthContext();

  const { data: role } = useQuery<AdventureRole>({
    queryKey: ['adventure-role', adventureId, user?.id],
    queryFn: async () => {
      if (isAdmin) return 'dm';
      const { data, error } = await supabase
        .from('adventure_access')
        .select('role')
        .eq('user_id', user!.id)
        .eq('adventure_id', adventureId!)
        .single();
      if (error || !data) return 'player';
      return (data.role as AdventureRole) ?? 'player';
    },
    enabled: !!adventureId && !!user,
  });

  const effectiveRole: AdventureRole = isAdmin ? 'dm' : (role ?? null);

  return {
    role: effectiveRole,
    canEdit: effectiveRole === 'dm',
    canEditEntries: effectiveRole === 'dm' || effectiveRole === 'scribe',
    canEditLocations: effectiveRole === 'dm' || effectiveRole === 'scribe',
    canEditCharacters: effectiveRole === 'dm',
    canDelete: effectiveRole === 'dm',
    isViewer: effectiveRole === 'player',
  };
}

/** Get all adventure roles for the current user (for the Index page) */
export function useAllAdventureRoles() {
  const { user, isAdmin } = useAuthContext();

  return useQuery<Record<string, AdventureRole>>({
    queryKey: ['adventure-roles-all', user?.id],
    queryFn: async () => {
      if (isAdmin) return {}; // admin always has dm-level access
      const { data, error } = await supabase
        .from('adventure_access')
        .select('adventure_id, role')
        .eq('user_id', user!.id);
      if (error) return {};
      const map: Record<string, AdventureRole> = {};
      for (const row of data) {
        map[row.adventure_id] = row.role as AdventureRole;
      }
      return map;
    },
    enabled: !!user,
  });
}
