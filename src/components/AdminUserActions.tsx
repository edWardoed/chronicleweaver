import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, KeyRound, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUserActionsProps {
  userId: string;
  email: string;
  displayName: string;
  isCurrentUser: boolean;
  isTargetAdmin: boolean;
  onDeleted: () => void;
}

async function callAdminAction(action: string, userId: string, email: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('admin-user-management', {
    body: { action, userId, email },
  });
  if (res.error) throw new Error(res.error.message);
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export function AdminUserActions({ userId, email, displayName, isCurrentUser, isTargetAdmin, onDeleted }: AdminUserActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, successMsg: string) => {
    setLoading(action);
    try {
      await callAdminAction(action, userId, email);
      toast.success(successMsg);
      if (action === 'delete_user') {
        setDeleteOpen(false);
        onDeleted();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem
            onClick={() => handleAction('resend_verification', 'Verification email sent')}
            disabled={!!loading}
            className="gap-2"
          >
            {loading === 'resend_verification' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Resend Verification
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction('reset_password', 'Password reset email sent')}
            disabled={!!loading}
            className="gap-2"
          >
            {loading === 'reset_password' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Reset Password
          </DropdownMenuItem>
          {!isCurrentUser && !isTargetAdmin && (
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              disabled={!!loading}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">Delete User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{displayName}</strong> ({email})?
              This will remove all their data and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('delete_user', 'User deleted')}
              disabled={loading === 'delete_user'}
              className="gap-2"
            >
              {loading === 'delete_user' && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
