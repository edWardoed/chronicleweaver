-- Revoke public EXECUTE on helper functions to prevent RPC probing
-- These functions are used internally by RLS policies (executed as postgres owner)
-- but should not be callable directly by authenticated/anon users

REVOKE EXECUTE ON FUNCTION public.get_adventure_role(uuid, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.has_adventure_access(uuid, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_pc_in_adventure(uuid, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated, anon;