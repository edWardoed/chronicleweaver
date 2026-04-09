import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter, useUpdateCharacter, useDeleteCharacter, uploadAvatarImage, type CharacterRow } from '@/hooks/useCharacters';
import { useAdventure } from '@/hooks/useAdventure';
import { useAdventureRole } from '@/hooks/useAdventureRole';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
type Ability = (typeof ABILITIES)[number];
const ABILITY_KEY: Record<Ability, keyof CharacterRow> = {
  STR: 'str_score', DEX: 'dex_score', CON: 'con_score', INT: 'int_score', WIS: 'wis_score', CHA: 'cha_score',
};

const PROF_RANKS = ['untrained', 'trained', 'expert', 'master', 'legendary'] as const;
const PROF_LABELS: Record<string, string> = { untrained: 'U', trained: 'T', expert: 'E', master: 'M', legendary: 'L' };
const PROF_BONUS: Record<string, number> = { untrained: 0, trained: 2, expert: 4, master: 6, legendary: 8 };

const SAVES = ['Fortitude', 'Reflex', 'Will'] as const;
const SAVE_ABILITY: Record<string, Ability> = { Fortitude: 'CON', Reflex: 'DEX', Will: 'WIS' };
const ATTITUDES = ['Friendly', 'Neutral', 'Wary', 'Hostile', 'Unknown'] as const;

interface PFNPCSkill { name: string; rank: string }

function calcMod(score: number): number { return Math.floor((score - 10) / 2); }
function formatMod(m: number): string { return m >= 0 ? `+${m}` : `${m}`; }

export default function PFNPCSheet() {
  const { adventureId, characterId } = useParams<{ adventureId: string; characterId: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(characterId);
  const { data: adventure } = useAdventure(adventureId);
  const { canEdit } = useAdventureRole(adventureId);
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const [form, setForm] = useState<Partial<CharacterRow>>({});
  const [pfProfs, setPfProfs] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (character && !loaded.current) {
      loaded.current = true;
      const { pf_proficiencies, ...rest } = character;
      setForm(rest);
      setPfProfs((pf_proficiencies as Record<string, string>) ?? {});
    }
  }, [character]);

  const abilitiesEditor = useEditor({
    extensions: [StarterKit],
    content: character?.features_traits ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[100px] focus:outline-none p-3' } },
  });

  const notesEditor = useEditor({
    extensions: [StarterKit],
    content: character?.notes ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[100px] focus:outline-none p-3' } },
  });

  useEffect(() => {
    if (abilitiesEditor && character?.features_traits && !abilitiesEditor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      abilitiesEditor.commands.setContent(character.features_traits);
    }
  }, [abilitiesEditor, character]);

  useEffect(() => {
    if (notesEditor && character?.notes && !notesEditor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      notesEditor.commands.setContent(character.notes);
    }
  }, [notesEditor, character]);

  const set = useCallback(<K extends keyof CharacterRow>(key: K, value: CharacterRow[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  }, []);

  const setNum = useCallback((key: keyof CharacterRow, value: string) => {
    set(key, (value === '' ? null : Number(value)) as any);
  }, [set]);

  const handleSave = useCallback(async () => {
    if (!characterId) return;
    setSaveStatus('saving');
    const payload: Record<string, unknown> = {
      ...form,
      pf_proficiencies: pfProfs,
      features_traits: abilitiesEditor?.getHTML() ?? '',
      notes: notesEditor?.getHTML() ?? '',
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    updateCharacter.mutate(
      { id: characterId, ...payload },
      {
        onSuccess: () => { setSaveStatus('saved'); toast.success('NPC saved'); },
        onError: () => { setSaveStatus('idle'); toast.error('Failed to save'); },
      }
    );
  }, [characterId, form, pfProfs, abilitiesEditor, notesEditor]);

  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded.current || saveStatus === 'saving') return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => handleSave(), 5000);
    return () => clearTimeout(autosaveRef.current);
  }, [form, pfProfs]);

  const handleDelete = () => {
    if (!characterId || !adventureId) return;
    deleteCharacter.mutate(
      { id: characterId, adventureId },
      { onSuccess: () => { navigate(`/adventure/${adventureId}`); toast.success('NPC deleted'); } }
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatarImage(file);
      set('avatar_url', url);
      toast.success('Avatar uploaded');
    } catch { toast.error('Failed to upload avatar'); }
  };

  const level = (form.level as number) ?? 1;
  const scores: Record<Ability, number> = {
    STR: (form.str_score as number) ?? 10, DEX: (form.dex_score as number) ?? 10,
    CON: (form.con_score as number) ?? 10, INT: (form.int_score as number) ?? 10,
    WIS: (form.wis_score as number) ?? 10, CHA: (form.cha_score as number) ?? 10,
  };
  const mods: Record<Ability, number> = {} as any;
  ABILITIES.forEach((a) => { mods[a] = calcMod(scores[a]); });

  const getProfTotal = (key: string, ability: Ability) => {
    const rank = pfProfs[key] ?? 'untrained';
    const bonus = rank === 'untrained' ? 0 : level + PROF_BONUS[rank];
    return bonus + mods[ability];
  };

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-foreground">Loading…</div>;
  if (!character) return <div className="min-h-screen bg-background p-8 text-foreground">NPC not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/adventure/${adventureId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href={`/adventure/${adventureId}`}>{adventure?.title ?? '…'}</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{(form.name as string) || 'NPC'}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Badge variant={saveStatus === 'saved' ? 'secondary' : saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
        </Badge>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <section className="bg-card border border-border rounded-lg p-5">
            <div className="flex gap-5">
              <label className="cursor-pointer flex-shrink-0">
                <Avatar className="w-24 h-24">
                  {form.avatar_url ? <AvatarImage src={form.avatar_url as string} /> : null}
                  <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xl">{(form.name as string)?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={(form.name as string) ?? ''} onChange={(e) => set('name', e.target.value)} className="font-heading text-xl bg-muted border-border" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Level</label>
                    <Input type="number" value={level} onChange={(e) => setNum('level', e.target.value)} className="bg-muted border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Role / Occupation</label>
                    <Input value={(form.role_occupation as string) ?? ''} onChange={(e) => set('role_occupation' as any, e.target.value)} placeholder="e.g. Guard Captain" className="bg-muted border-border" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Attitude</label>
                    <Select value={(form.attitude as string) ?? 'Unknown'} onValueChange={(v) => set('attitude' as any, v)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ATTITUDES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ability Scores (compact) */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Ability Scores</h3>
            <div className="grid grid-cols-6 gap-2">
              {ABILITIES.map((ab) => (
                <div key={ab} className="text-center bg-muted rounded-lg p-2">
                  <div className="text-xs text-muted-foreground font-heading mb-1">{ab}</div>
                  <div className="text-lg font-heading text-foreground mb-1">{formatMod(mods[ab])}</div>
                  <Input type="number" value={scores[ab]} onChange={(e) => setNum(ABILITY_KEY[ab], e.target.value)} className="h-7 text-center text-xs bg-background border-border" />
                </div>
              ))}
            </div>
          </section>

          {/* Key Stats */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Key Stats</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {([['AC', 'armor_class'], ['HP', 'max_hp'], ['Speed', 'speed']] as [string, keyof CharacterRow][]).map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <Input type="number" value={(form[key] as number) ?? 0} onChange={(e) => setNum(key, e.target.value)} className="bg-muted border-border" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground">Perception</label>
                <div className="flex items-center gap-1 mt-1">
                  <Select value={pfProfs['Perception'] ?? 'untrained'} onValueChange={(v) => { setPfProfs((p) => ({ ...p, Perception: v })); setSaveStatus('idle'); }}>
                    <SelectTrigger className="bg-muted border-border h-8 w-14 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROF_RANKS.map((r) => <SelectItem key={r} value={r}>{PROF_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-sm font-heading">{formatMod(getProfTotal('Perception', 'WIS'))}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Saves */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Saving Throws</h3>
            <div className="grid grid-cols-3 gap-3">
              {SAVES.map((save) => (
                <div key={save} className="bg-muted rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground font-heading mb-1">{save}</div>
                  <div className="text-lg font-heading text-foreground mb-1">{formatMod(getProfTotal(save, SAVE_ABILITY[save]))}</div>
                  <Select value={pfProfs[save] ?? 'untrained'} onValueChange={(v) => { setPfProfs((p) => ({ ...p, [save]: v })); setSaveStatus('idle'); }}>
                    <SelectTrigger className="bg-background border-border h-7 text-xs justify-center"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROF_RANKS.map((r) => <SelectItem key={r} value={r}>{PROF_LABELS[r]} — {r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </section>

          {/* Special Abilities */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Special Abilities</h3>
            <div className="bg-muted rounded-md border border-border">
              <EditorContent editor={abilitiesEditor} />
            </div>
          </section>

          {/* Description */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Description</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Physical Description</label>
                <Textarea value={(form.physical_description as string) ?? ''} onChange={(e) => set('physical_description' as any, e.target.value)} placeholder="Appearance, distinguishing features…" className="bg-muted border-border min-h-[100px] mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Voice & Mannerisms</label>
                <Textarea value={(form.voice_mannerisms as string) ?? ''} onChange={(e) => set('voice_mannerisms' as any, e.target.value)} placeholder="How they speak, habits, quirks…" className="bg-muted border-border min-h-[100px] mt-1" />
              </div>
            </div>
          </section>

          {/* Story Role */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Story Role</h3>
            <Textarea value={(form.story_role as string) ?? ''} onChange={(e) => set('story_role' as any, e.target.value)} placeholder="Role in the adventure — goals, relationship to the party…" className="bg-muted border-border min-h-[100px]" />
          </section>

          {/* DM Notes */}
          <section className="bg-card border border-border rounded-lg p-4" style={{ backgroundColor: 'hsl(225 20% 15%)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm text-gold">DM Notes & Secrets</h3>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Checkbox id="pf-npc-dm-notes-visible" checked={!!form.dm_notes_visible} onCheckedChange={(checked) => set('dm_notes_visible' as any, !!checked)} />
                  <Label htmlFor="pf-npc-dm-notes-visible" className="text-xs text-muted-foreground cursor-pointer">Visible to Players</Label>
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-md border border-border">
              <EditorContent editor={notesEditor} />
            </div>
          </section>

        </div>
      </div>

      <footer className="border-t border-border px-4 py-3 flex items-center gap-3">
        <Button onClick={handleSave} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
          <Save className="w-4 h-4" /> Save
        </Button>
        <Button variant="outline" onClick={() => { handleSave(); navigate(`/adventure/${adventureId}`); }} className="border-border">
          Back
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </footer>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-foreground">Delete this NPC?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
