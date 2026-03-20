import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacters, useCreateCharacter, useDeleteCharacter, type CharacterRow } from '@/hooks/useCharacters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  adventureId: string;
}

export function CharacterList({ adventureId }: Props) {
  const navigate = useNavigate();
  const { data: characters, isLoading } = useCharacters(adventureId);
  const createCharacter = useCreateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'PC' | 'NPC'>('PC');
  const [deleteTarget, setDeleteTarget] = useState<CharacterRow | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCharacter.mutate(
      { adventure_id: adventureId, name: newName.trim(), type: newType },
      {
        onSuccess: (data) => {
          setAddOpen(false);
          setNewName('');
          toast.success('Character created');
          navigate(`/adventure/${adventureId}/character/${data.id}`);
        },
        onError: () => toast.error('Failed to create character'),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCharacter.mutate(
      { id: deleteTarget.id, adventureId },
      {
        onSuccess: () => { setDeleteTarget(null); toast.success('Character deleted'); },
        onError: () => toast.error('Failed to delete'),
      }
    );
  };

  const pcs = characters?.filter((c) => c.type === 'PC') ?? [];
  const npcs = characters?.filter((c) => c.type === 'NPC') ?? [];

  const renderCards = (list: CharacterRow[]) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">No characters yet.</p>
          <Button onClick={() => setAddOpen(true)} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-heading">
            Add your first character
          </Button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            onEdit={() => navigate(`/adventure/${adventureId}/character/${c.id}`)}
            onDelete={() => setDeleteTarget(c)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-lg text-foreground">Characters</h2>
        <Button onClick={() => setAddOpen(true)} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
          <Plus className="w-4 h-4" /> Add Character
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="bg-transparent h-auto gap-0 mb-4">
            <TabsTrigger value="all" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">
              All ({characters?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="pc" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">
              PCs ({pcs.length})
            </TabsTrigger>
            <TabsTrigger value="npc" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">
              NPCs ({npcs.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderCards(characters ?? [])}</TabsContent>
          <TabsContent value="pc">{renderCards(pcs)}</TabsContent>
          <TabsContent value="npc">{renderCards(npcs)}</TabsContent>
        </Tabs>
      )}

      {/* Add Character Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-gold">New Character</DialogTitle>
            <DialogDescription>Create a new character for this adventure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground">Type</Label>
              <RadioGroup value={newType} onValueChange={(v) => setNewType(v as 'PC' | 'NPC')} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="PC" id="type-pc" />
                  <Label htmlFor="type-pc" className="text-foreground">Player Character</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="NPC" id="type-npc" />
                  <Label htmlFor="type-npc" className="text-foreground">NPC</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Character name…"
                className="bg-muted border-border mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading">
              Create & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-foreground">Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The character will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CharacterCard({ character, onEdit, onDelete }: { character: CharacterRow; onEdit: () => void; onDelete: () => void }) {
  const isPC = character.type === 'PC';
  const subtitle = isPC
    ? [character.class, character.race].filter(Boolean).join(' · ') || 'No class/race set'
    : character.notes?.slice(0, 60) || 'No role set';

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 group hover:border-gold/30 transition-colors">
      <Avatar className="w-12 h-12 flex-shrink-0">
        {character.avatar_url ? <AvatarImage src={character.avatar_url} /> : null}
        <AvatarFallback className="bg-muted text-muted-foreground font-heading text-sm">
          {character.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-heading text-foreground truncate">{character.name}</span>
          <Badge className={isPC ? 'bg-blue-900/50 text-blue-300 border-blue-700/50' : 'bg-amber-900/50 text-amber-300 border-amber-700/50'}>
            {character.type}
          </Badge>
          {isPC && character.level && (
            <Badge variant="outline" className="border-gold/40 text-gold text-xs">Lv {character.level}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}
