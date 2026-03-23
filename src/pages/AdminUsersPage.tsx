import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Shield, User, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { isAdmin, signUp } = useAuthContext();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
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
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={u.role === 'admin' ? 'bg-gold text-background' : ''}>
                    {u.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
