import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Divider } from '@/components/Divider';
import { toast } from 'sonner';

export default function LoginPage() {
  const { signIn, signUp } = useAuthContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          navigate('/');
        }
      } else {
        if (!displayName.trim()) {
          toast.error('Name is required');
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, displayName.trim());
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Check your email for a verification link!');
          setMode('login');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-gold" />
            <CardTitle className="font-heading text-3xl text-gold tracking-wide">Chronicle</CardTitle>
          </div>
          <Divider />
          <CardDescription className="text-parchment/70 italic">
            {mode === 'login' ? 'Sign in to your chronicle' : 'Create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="bg-muted border-border"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-muted border-border"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
            {mode === 'login' && (
              <div className="text-center pt-2">
                <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
