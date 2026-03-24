import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type AdventureRole = 'dm' | 'scribe' | 'viewer' | null;

export function useAdventureRole(adventureId: string | undefined) {
  const { user, isAdmin } = useAuthContext();

  const { data: role } = useQuery<AdventureRole>({
    queryKey: ['adventure-role', adventureId, user?.id],
    queryFn: async () => {
      if (isAdmin) return 'dm'; // admins have full access
      const { data, error } = await supabase
        .from('adventure_access')
        .select('role')
        .eq('user_id', user!.id)
        .eq('adventure_id', adventureId!)
        .single();
      if (error || !data) return 'viewer';
      return (data.role as AdventureRole) ?? 'viewer';
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
    isViewer: effectiveRole === 'viewer',
  };
}
