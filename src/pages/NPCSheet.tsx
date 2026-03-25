import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter, useUpdateCharacter, useDeleteCharacter, uploadAvatarImage, type CharacterRow } from '@/hooks/useCharacters';
import { useAdventure } from '@/hooks/useAdventure';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAdventureRole } from '@/hooks/useAdventureRole';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ATTITUDES = ['Friendly', 'Neutral', 'Wary', 'Hostile', 'Unknown'] as const;
const STAT_KEYS: { label: string; key: keyof CharacterRow }[] = [
  { label: 'AC', key: 'armor_class' },
  { label: 'HP', key: 'max_hp' },
  { label: 'STR', key: 'str_score' },
  { label: 'DEX', key: 'dex_score' },
  { label: 'CON', key: 'con_score' },
  { label: 'INT', key: 'int_score' },
  { label: 'WIS', key: 'wis_score' },
  { label: 'CHA', key: 'cha_score' },
];

export default function NPCSheet() {
  const { adventureId, characterId } = useParams<{ adventureId: string; characterId: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(characterId);
  const { data: adventure } = useAdventure(adventureId);
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const [form, setForm] = useState<Partial<CharacterRow>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (character && !loaded.current) {
      loaded.current = true;
      setForm(character);
    }
  }, [character]);

  const notesEditor = useEditor({
    extensions: [StarterKit],
    content: character?.notes ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[150px] focus:outline-none p-3' } },
  });

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
  }, [characterId, form, notesEditor]);

  // Autosave
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded.current || saveStatus === 'saving') return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => handleSave(), 5000);
    return () => clearTimeout(autosaveRef.current);
  }, [form]);

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
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-foreground">Loading…</div>;
  if (!character) return <div className="min-h-screen bg-background p-8 text-foreground">NPC not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
              <BreadcrumbItem><BreadcrumbLink href={`/adventure/${adventureId}`}>Characters</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{(form.name as string) || 'NPC'}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Badge variant={saveStatus === 'saved' ? 'secondary' : saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
        </Badge>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Header Row ── */}
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
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={(form.name as string) ?? ''} onChange={(e) => set('name', e.target.value)} className="font-heading text-xl bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Role / Occupation</label>
                    <Input value={(form.role_occupation as string) ?? ''} onChange={(e) => set('role_occupation' as any, e.target.value)} placeholder="e.g. Innkeeper, Court Wizard" className="bg-muted border-border" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Attitude toward Party</label>
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

          {/* ── Stats Block ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Stats</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {STAT_KEYS.map(({ label, key }) => (
                <div key={key} className="text-center bg-muted rounded-lg p-2">
                  <div className="text-xs text-muted-foreground font-heading mb-1">{label}</div>
                  <Input
                    type="number"
                    value={(form[key] as number) ?? ''}
                    onChange={(e) => setNum(key, e.target.value)}
                    className="h-8 text-center text-sm bg-background border-border"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── Description ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Description</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Physical Description</label>
                <Textarea
                  value={(form.physical_description as string) ?? ''}
                  onChange={(e) => set('physical_description' as any, e.target.value)}
                  placeholder="Appearance, distinguishing features…"
                  className="bg-muted border-border min-h-[100px] mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Voice & Mannerisms</label>
                <Textarea
                  value={(form.voice_mannerisms as string) ?? ''}
                  onChange={(e) => set('voice_mannerisms' as any, e.target.value)}
                  placeholder="How they speak, habits, quirks…"
                  className="bg-muted border-border min-h-[100px] mt-1"
                />
              </div>
            </div>
          </section>

          {/* ── Story Role ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Story Role</h3>
            <Textarea
              value={(form.story_role as string) ?? ''}
              onChange={(e) => set('story_role' as any, e.target.value)}
              placeholder="Role in the adventure — why they matter, goals, relationship to the party…"
              className="bg-muted border-border min-h-[100px]"
            />
          </section>

          {/* ── DM Notes ── */}
          <section className="bg-card border border-border rounded-lg p-4" style={{ backgroundColor: 'hsl(225 20% 15%)' }}>
            <h3 className="font-heading text-sm text-gold mb-3">DM Notes & Secrets</h3>
            <div className="bg-muted/50 rounded-md border border-border">
              <EditorContent editor={notesEditor} />
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
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
