import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Users, Shield, User, Loader2, BookOpen } from 'lucide-react';
import { AdminUserActions } from '@/components/AdminUserActions';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

interface AccessRow {
  adventure_id: string;
  role: string;
}

const ADVENTURE_ROLES = [
  { value: 'dm', label: 'DM', description: 'Full edit access' },
  { value: 'scribe', label: 'Scribe', description: 'Edit entries & locations' },
  { value: 'player', label: 'Player', description: 'Read-only access' },
];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { isAdmin, signUp, user: currentUser } = useAuthContext();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState<UserWithRole | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
      if (rErr) throw rErr;
      return (profiles as any[]).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        role: (roles as any[]).find((r) => r.user_id === p.id)?.role ?? 'user',
      }));
    },
    enabled: isAdmin,
  });

  const { data: adventures } = useQuery({
    queryKey: ['adventures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('adventures').select('id, title');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: accessList } = useQuery<AccessRow[]>({
    queryKey: ['adventure-access', accessOpen?.id],
    queryFn: async () => {
      if (!accessOpen) return [];
      const { data, error } = await supabase
        .from('adventure_access')
        .select('adventure_id, role')
        .eq('user_id', accessOpen.id);
      if (error) throw error;
      return data as AccessRow[];
    },
    enabled: !!accessOpen,
  });

  const setAccess = useMutation({
    mutationFn: async ({ userId, adventureId, role }: { userId: string; adventureId: string; role: string | null }) => {
      if (role === null) {
        // Remove access
        const { error } = await supabase.from('adventure_access').delete().eq('user_id', userId).eq('adventure_id', adventureId);
        if (error) throw error;
      } else {
        // Check if access exists
        const existing = accessList?.find((a) => a.adventure_id === adventureId);
        if (existing) {
          const { error } = await supabase
            .from('adventure_access')
            .update({ role: role as any })
            .eq('user_id', userId)
            .eq('adventure_id', adventureId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('adventure_access')
            .insert([{ user_id: userId, adventure_id: adventureId, role: role as any }]);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adventure-access', accessOpen?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('All fields are required');
      return;
    }
    setCreating(true);
    try {
      const { error } = await signUp(newEmail, newPassword, newName.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('User created! They will need to verify their email.');
        setCreateOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      }
    } finally {
      setCreating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Access denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Users className="w-6 h-6 text-gold" />
          <h1 className="font-heading text-2xl text-gold">User Management</h1>
          <div className="flex-1" />
          <Button onClick={() => setCreateOpen(true)} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-muted" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {users?.map((u) => (
              <Card key={u.id} className="border-border bg-card">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {u.role === 'admin' ? <Shield className="w-5 h-5 text-gold" /> : <User className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{u.display_name}</p>
                    <p className="text-muted-foreground text-sm truncate">{u.email}</p>
                  </div>
                  {u.role !== 'admin' && (
                    <Button variant="outline" size="sm" onClick={() => setAccessOpen(u)} className="border-gold/40 text-gold gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Access
                    </Button>
                  )}
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={u.role === 'admin' ? 'bg-gold text-background' : ''}>
                    {u.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-gold">Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="User's name" required className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" required className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-muted border-border" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adventure access dialog with role selection */}
      <Dialog open={!!accessOpen} onOpenChange={(open) => { if (!open) setAccessOpen(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-gold">
              Adventure Access — {accessOpen?.display_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {adventures?.length === 0 && <p className="text-muted-foreground text-sm">No adventures created yet.</p>}
            {adventures?.map((adv) => {
              const access = accessList?.find((a) => a.adventure_id === adv.id);
              const currentRole = access?.role ?? null;
              return (
                <div key={adv.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <BookOpen className="w-4 h-4 text-gold flex-shrink-0" />
                  <span className="text-foreground text-sm flex-1 truncate">{adv.title}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={currentRole ?? 'none'}
                      onValueChange={(value) => {
                        if (accessOpen) {
                          setAccess.mutate({
                            userId: accessOpen.id,
                            adventureId: adv.id,
                            role: value === 'none' ? null : value,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none" className="text-muted-foreground">No Access</SelectItem>
                        {ADVENTURE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            <span className="font-medium">{r.label}</span>
                            <span className="text-muted-foreground ml-1">— {r.description}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
