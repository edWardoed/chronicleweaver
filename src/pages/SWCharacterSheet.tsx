import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter, useUpdateCharacter, useDeleteCharacter, uploadAvatarImage, type CharacterRow, type EquipmentItem } from '@/hooks/useCharacters';
import { useAdventure } from '@/hooks/useAdventure';
import { useAdventureRole } from '@/hooks/useAdventureRole';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Plus, Trash2, X, Minus } from 'lucide-react';
import { toast } from 'sonner';

const DIE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd12+1', 'd12+2'] as const;
const SW_ATTRIBUTES = ['agility', 'smarts', 'spirit', 'strength', 'vigor'] as const;
const RANKS = ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary'] as const;

interface SWSkill { name: string; die: string }

export default function SWCharacterSheet() {
  const { adventureId, characterId } = useParams<{ adventureId: string; characterId: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(characterId);
  const { data: adventure } = useAdventure(adventureId);
  const { canEditCharacters, role } = useAdventureRole(adventureId);
  const { user } = useAuthContext();
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const isOwner = character?.created_by === user?.id;
  const canEditThisChar = canEditCharacters || (isOwner && (character?.type === 'PC' || (character?.type === 'NPC' && role === 'scribe')));
  const isReadOnly = !canEditThisChar;

  const [form, setForm] = useState<Partial<CharacterRow>>({});
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [swAttrs, setSwAttrs] = useState<Record<string, string>>({ agility: 'd4', smarts: 'd4', spirit: 'd4', strength: 'd4', vigor: 'd4' });
  const [swSkills, setSwSkills] = useState<SWSkill[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (character && !loaded.current) {
      loaded.current = true;
      const { equipment: eq, sw_attributes, sw_skills, ...rest } = character;
      setForm(rest);
      setEquipment((eq as EquipmentItem[]) ?? []);
      setSwAttrs((sw_attributes as Record<string, string>) ?? { agility: 'd4', smarts: 'd4', spirit: 'd4', strength: 'd4', vigor: 'd4' });
      setSwSkills((sw_skills as SWSkill[]) ?? []);
    }
  }, [character]);

  const edgesEditor = useEditor({
    extensions: [StarterKit],
    content: character?.features_traits ?? '',
    editable: !isReadOnly,
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[100px] focus:outline-none p-3' } },
  });

  const notesEditor = useEditor({
    extensions: [StarterKit],
    content: character?.notes ?? '',
    editable: !isReadOnly,
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[100px] focus:outline-none p-3' } },
  });

  useEffect(() => {
    if (edgesEditor && character?.features_traits && !edgesEditor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      edgesEditor.commands.setContent(character.features_traits);
    }
  }, [edgesEditor, character]);

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
    set(key, value === '' ? null as any : Number(value));
  }, [set]);

  const handleSave = useCallback(async () => {
    if (!characterId || isReadOnly) return;
    setSaveStatus('saving');
    const payload: Record<string, unknown> = {
      ...form,
      equipment,
      sw_attributes: swAttrs,
      sw_skills: swSkills,
      features_traits: edgesEditor?.getHTML() ?? '',
      notes: notesEditor?.getHTML() ?? '',
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    updateCharacter.mutate(
      { id: characterId, ...payload },
      {
        onSuccess: () => { setSaveStatus('saved'); toast.success('Character saved'); },
        onError: () => { setSaveStatus('idle'); toast.error('Failed to save'); },
      }
    );
  }, [characterId, form, equipment, swAttrs, swSkills, edgesEditor, notesEditor]);

  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded.current || saveStatus === 'saving' || isReadOnly) return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => handleSave(), 5000);
    return () => clearTimeout(autosaveRef.current);
  }, [form, equipment, swAttrs, swSkills]);

  const handleDelete = () => {
    if (!characterId || !adventureId) return;
    deleteCharacter.mutate(
      { id: characterId, adventureId },
      { onSuccess: () => { navigate(`/adventure/${adventureId}`); toast.success('Character deleted'); } }
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

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-foreground">Loading…</div>;
  if (!character) return <div className="min-h-screen bg-background p-8 text-foreground">Character not found</div>;

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
              <BreadcrumbItem><BreadcrumbPage>{(form.name as string) || 'Character'}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {isReadOnly ? (
          <Badge variant="outline" className="text-xs border-muted-foreground/40 text-muted-foreground">Read Only</Badge>
        ) : (
          <Badge variant={saveStatus === 'saved' ? 'secondary' : saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
          </Badge>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <fieldset disabled={isReadOnly} className="max-w-5xl mx-auto space-y-6">

          {/* Header Row */}
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-4">
              <label className={`flex-shrink-0 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                <Avatar className="w-20 h-20">
                  {form.avatar_url ? <AvatarImage src={form.avatar_url as string} /> : null}
                  <AvatarFallback className="bg-muted text-muted-foreground font-heading text-lg">{(form.name as string)?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {!isReadOnly && <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />}
              </label>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={(form.name as string) ?? ''} onChange={(e) => set('name', e.target.value)} className="font-heading text-lg bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Race / Ancestry</label>
                  <Input value={(form.race as string) ?? ''} onChange={(e) => set('race', e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Rank</label>
                  <Select value={(form.sw_rank as string) ?? 'Novice'} onValueChange={(v) => set('sw_rank' as any, v)}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Attributes */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Attributes</h3>
            <div className="grid grid-cols-5 gap-3">
              {SW_ATTRIBUTES.map((attr) => (
                <div key={attr} className="text-center bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground font-heading mb-1 capitalize">{attr}</div>
                  <Select value={swAttrs[attr] ?? 'd4'} onValueChange={(v) => { setSwAttrs((p) => ({ ...p, [attr]: v })); setSaveStatus('idle'); }}>
                    <SelectTrigger className="bg-background border-border h-10 text-lg font-heading justify-center"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIE_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </section>

          {/* Derived Stats + Wounds/Fatigue/Bennies */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Derived Stats & Status</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Pace</label>
                <Input type="number" value={(form.sw_pace as number) ?? 6} onChange={(e) => setNum('sw_pace' as any, e.target.value)} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Parry</label>
                <Input type="number" value={(form.sw_parry as number) ?? 2} onChange={(e) => setNum('sw_parry' as any, e.target.value)} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Toughness</label>
                <Input type="number" value={(form.sw_toughness as number) ?? 2} onChange={(e) => setNum('sw_toughness' as any, e.target.value)} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Wounds (0–3)</label>
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map((i) => (
                    <Checkbox
                      key={i}
                      checked={((form.sw_wounds as number) ?? 0) > i}
                      onCheckedChange={() => set('sw_wounds' as any, (((form.sw_wounds as number) ?? 0) > i ? i : i + 1))}
                    />
                  ))}
                </div>
                {((form.sw_wounds as number) ?? 0) >= 3 && <span className="text-xs text-destructive mt-1">Incapacitated</span>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fatigue (0–2)</label>
                <div className="flex gap-2 mt-2">
                  {[0, 1].map((i) => (
                    <Checkbox
                      key={i}
                      checked={((form.sw_fatigue as number) ?? 0) > i}
                      onCheckedChange={() => set('sw_fatigue' as any, (((form.sw_fatigue as number) ?? 0) > i ? i : i + 1))}
                    />
                  ))}
                </div>
                {((form.sw_fatigue as number) ?? 0) >= 2 && <span className="text-xs text-destructive mt-1">Incapacitated</span>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bennies</label>
                <div className="flex items-center gap-2 mt-1">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => set('sw_bennies' as any, Math.max(0, ((form.sw_bennies as number) ?? 3) - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-heading text-xl text-foreground w-6 text-center">{(form.sw_bennies as number) ?? 3}</span>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => set('sw_bennies' as any, ((form.sw_bennies as number) ?? 3) + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Skills</h3>
            <div className="space-y-2">
              {swSkills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={skill.name}
                    onChange={(e) => { const c = [...swSkills]; c[i] = { ...c[i], name: e.target.value }; setSwSkills(c); setSaveStatus('idle'); }}
                    placeholder="Skill name"
                    className="bg-muted border-border flex-1"
                  />
                  <Select value={skill.die} onValueChange={(v) => { const c = [...swSkills]; c[i] = { ...c[i], die: v }; setSwSkills(c); setSaveStatus('idle'); }}>
                    <SelectTrigger className="bg-muted border-border w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIE_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSwSkills(swSkills.filter((_, j) => j !== i)); setSaveStatus('idle'); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2 border-border text-muted-foreground" onClick={() => { setSwSkills([...swSkills, { name: '', die: 'd4' }]); setSaveStatus('idle'); }}>
              <Plus className="w-3 h-3 mr-1" /> Add Skill
            </Button>
          </section>

          {/* Edges */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Edges</h3>
            <div className="bg-muted rounded-md border border-border">
              <EditorContent editor={edgesEditor} />
            </div>
          </section>

          {/* Hindrances */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Hindrances</h3>
            <Textarea
              value={(form.flaws as string) ?? ''}
              onChange={(e) => set('flaws', e.target.value)}
              className="bg-muted border-border min-h-[80px]"
              placeholder="Major and Minor Hindrances…"
            />
          </section>

          {/* Gear */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Gear</h3>
            <div className="space-y-2">
              {equipment.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.name} onChange={(e) => { const c = [...equipment]; c[i] = { ...c[i], name: e.target.value }; setEquipment(c); setSaveStatus('idle'); }} placeholder="Item name" className="bg-muted border-border flex-1" />
                  <Input type="number" value={item.quantity} onChange={(e) => { const c = [...equipment]; c[i] = { ...c[i], quantity: Number(e.target.value) }; setEquipment(c); setSaveStatus('idle'); }} className="bg-muted border-border w-16" placeholder="Qty" />
                  <Input type="number" value={item.weight} onChange={(e) => { const c = [...equipment]; c[i] = { ...c[i], weight: Number(e.target.value) }; setEquipment(c); setSaveStatus('idle'); }} className="bg-muted border-border w-16" placeholder="Wt" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setEquipment(equipment.filter((_, j) => j !== i)); setSaveStatus('idle'); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2 border-border text-muted-foreground" onClick={() => { setEquipment([...equipment, { name: '', quantity: 1, weight: 0 }]); setSaveStatus('idle'); }}>
              <Plus className="w-3 h-3 mr-1" /> Add Item
            </Button>
          </section>

          {/* Personality */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Personality & Concept</h3>
            <Textarea
              value={(form.personality_traits as string) ?? ''}
              onChange={(e) => set('personality_traits', e.target.value)}
              className="bg-muted border-border min-h-[80px]"
              placeholder="Character concept, personality traits, goals…"
            />
          </section>

          {/* Notes */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Notes</h3>
            <div className="bg-muted rounded-md border border-border">
              <EditorContent editor={notesEditor} />
            </div>
          </section>

        </fieldset>
      </div>

      <footer className="sticky bottom-0 z-10 bg-background border-t border-border px-4 py-3 flex items-center gap-3">
        {!isReadOnly && (
          <Button onClick={handleSave} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
            <Save className="w-4 h-4" /> Save
          </Button>
        )}
        <Button variant="outline" onClick={() => { if (!isReadOnly) handleSave(); navigate(`/adventure/${adventureId}`); }} className="border-border">
          Back
        </Button>
        {!isReadOnly && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
      </footer>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-foreground">Delete this character?</AlertDialogTitle>
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
