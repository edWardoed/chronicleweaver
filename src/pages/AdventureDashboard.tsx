import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdventure, useUpdateAdventure } from '@/hooks/useAdventure';
import { useEntries, useDeleteEntry } from '@/hooks/useEntries';
import { useCharacters } from '@/hooks/useCharacters';
import { uploadCoverImage } from '@/hooks/useAdventures';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { DeleteEntryDialog } from '@/components/DeleteEntryDialog';
import { EntryCard } from '@/components/EntryCard';
import { toast } from 'sonner';
import type { Entry } from '@/lib/types';

export default function AdventureDashboard() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();
  const { data: adventure, isLoading } = useAdventure(adventureId);
  const { data: entries, isLoading: entriesLoading } = useEntries(adventureId!);
  const { data: characters } = useCharacters(adventureId!);
  const updateAdventure = useUpdateAdventure();
  const deleteEntry = useDeleteEntry();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  const handleTitleSave = () => {
    if (titleDraft.trim() && adventure) {
      updateAdventure.mutate({ id: adventure.id, title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adventure) return;
    try {
      const url = await uploadCoverImage(file);
      updateAdventure.mutate({ id: adventure.id, cover_image_url: url });
      toast.success('Cover image updated');
    } catch {
      toast.error('Failed to upload image');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background p-8"><Skeleton className="h-12 w-64" /></div>;
  if (!adventure) return <div className="min-h-screen bg-background p-8 text-foreground">Adventure not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav bar */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {editingTitle ? (
          <Input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="max-w-xs font-heading text-lg bg-muted border-gold/40"
          />
        ) : (
          <button
            className="font-heading text-xl text-gold hover:text-gold-glow transition-colors flex items-center gap-2"
            onClick={() => { setTitleDraft(adventure.title); setEditingTitle(true); }}
          >
            {adventure.title}
            <Pencil className="w-3.5 h-3.5 opacity-50" />
          </button>
        )}
      </header>

      {/* Tabs */}
      <Tabs defaultValue="entries" className="flex-1 flex flex-col">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-auto gap-0">
            <TabsTrigger value="entries" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Entries</TabsTrigger>
            <TabsTrigger value="characters" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Characters</TabsTrigger>
            <TabsTrigger value="locations" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Locations</TabsTrigger>
            <TabsTrigger value="settings" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Entries Tab */}
        <TabsContent value="entries" className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg text-foreground">Journal Entries</h2>
              <Button
                onClick={() => navigate(`/adventure/${adventureId}/entry/new`)}
                className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2"
              >
                <Plus className="w-4 h-4" /> New Entry
              </Button>
            </div>

            {entriesLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : entries && entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    characters={characters ?? []}
                    onEdit={() => navigate(`/adventure/${adventureId}/entry/${entry.id}`)}
                    onDelete={() => setDeleteTarget(entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No entries yet. Start writing your chronicle.</p>
                <Button
                  onClick={() => navigate(`/adventure/${adventureId}/entry/new`)}
                  variant="outline"
                  className="border-gold/40 text-gold hover:bg-gold/10 font-heading"
                >
                  Write your first entry
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Characters Tab - placeholder */}
        <TabsContent value="characters" className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto text-center py-16">
            <p className="text-muted-foreground">Character management coming soon.</p>
          </div>
        </TabsContent>

        {/* Locations Tab - placeholder */}
        <TabsContent value="locations" className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto text-center py-16">
            <p className="text-muted-foreground">Location management coming soon.</p>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 p-4 md:p-6">
          <div className="max-w-lg mx-auto space-y-6">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Adventure Title</label>
              <Input
                defaultValue={adventure.title}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== adventure.title) updateAdventure.mutate({ id: adventure.id, title: v });
                }}
                className="font-heading bg-muted border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Cover Image</label>
              {adventure.cover_image_url && (
                <img src={adventure.cover_image_url} alt="Cover" className="w-full max-w-xs h-40 object-cover rounded-md mb-2" />
              )}
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="bg-muted border-border" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DeleteEntryDialog
        entry={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteEntry.mutate({ id: deleteTarget.id, adventureId: adventureId! });
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
