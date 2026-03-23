import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdventures } from '@/hooks/useAdventures';
import { useAuthContext } from '@/contexts/AuthContext';
import { AdventureCard } from '@/components/AdventureCard';
import { CreateAdventureModal } from '@/components/CreateAdventureModal';
import { DeleteAdventureDialog } from '@/components/DeleteAdventureDialog';
import { Divider } from '@/components/Divider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BookOpen, LogOut, Users, Shield } from 'lucide-react';
import type { Adventure } from '@/lib/types';
import emptyScroll from '@/assets/empty-scroll.png';

export default function Index() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Adventure | null>(null);
  const { data: adventures, isLoading } = useAdventures();
  const { profile, isAdmin, signOut } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid md:grid-cols-[340px_1fr] gap-8 md:gap-12">
        {/* Left column — Branding */}
        <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-gold" />
            <h1 className="font-heading text-4xl md:text-5xl text-gold tracking-wide">Chronicle</h1>
          </div>
          <Divider />
          <p className="text-parchment/70 italic text-sm mb-8">Record the legends of your party</p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2 px-6"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Create Adventure
          </Button>
        </div>

        {/* Right column — Adventures */}
        <div className="flex flex-col min-h-[400px]">
          <h2 className="font-heading text-xl text-foreground mb-4">Your Adventures</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-muted" />
              ))}
            </div>
          ) : adventures && adventures.length > 0 ? (
            <ScrollArea className="flex-1 -mr-2 pr-2">
              <div className="space-y-3">
                {adventures.map((adv) => (
                  <AdventureCard
                    key={adv.id}
                    adventure={adv}
                    onView={(id) => navigate(`/adventure/${id}/view`)}
                    onEdit={(id) => navigate(`/adventure/${id}`)}
                    onDelete={(a) => setDeleteTarget(a)}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <img src={emptyScroll} alt="Empty scroll" className="w-48 h-48 object-contain opacity-70 mb-6" />
              <p className="text-muted-foreground mb-4">No chronicles yet</p>
              <Button
                onClick={() => setCreateOpen(true)}
                variant="outline"
                className="border-gold/40 text-gold hover:bg-gold/10 font-heading"
              >
                Begin your first chronicle
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateAdventureModal open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteAdventureDialog
        adventureId={deleteTarget?.id ?? null}
        adventureTitle={deleteTarget?.title ?? ''}
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      />
    </div>
  );
}
