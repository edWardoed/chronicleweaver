import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter, useUpdateCharacter, useDeleteCharacter, uploadAvatarImage, type CharacterRow, type EquipmentItem, type SpellRow } from '@/hooks/useCharacters';
import { useAdventure } from '@/hooks/useAdventure';
import { useAdventureRole } from '@/hooks/useAdventureRole';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Save, Plus, Trash2, X, Minus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
type Ability = (typeof ABILITIES)[number];
const ABILITY_KEY: Record<Ability, keyof CharacterRow> = {
  STR: 'str_score', DEX: 'dex_score', CON: 'con_score', INT: 'int_score', WIS: 'wis_score', CHA: 'cha_score',
};

const PROF_RANKS = ['untrained', 'trained', 'expert', 'master', 'legendary'] as const;
const PROF_LABELS: Record<string, string> = { untrained: 'U', trained: 'T', expert: 'E', master: 'M', legendary: 'L' };
const PROF_BONUS: Record<string, number> = { untrained: 0, trained: 2, expert: 4, master: 6, legendary: 8 };

const PF_SKILLS = [
  'Acrobatics', 'Arcana', 'Athletics', 'Crafting', 'Deception', 'Diplomacy',
  'Intimidation', 'Lore', 'Medicine', 'Nature', 'Occultism', 'Performance',
  'Religion', 'Society', 'Stealth', 'Survival', 'Thievery',
] as const;

const PF_SKILL_ABILITY: Record<string, Ability> = {
  Acrobatics: 'DEX', Arcana: 'INT', Athletics: 'STR', Crafting: 'INT',
  Deception: 'CHA', Diplomacy: 'CHA', Intimidation: 'CHA', Lore: 'INT',
  Medicine: 'WIS', Nature: 'WIS', Occultism: 'INT', Performance: 'CHA',
  Religion: 'WIS', Society: 'INT', Stealth: 'DEX', Survival: 'WIS', Thievery: 'DEX',
};

const SAVES = ['Fortitude', 'Reflex', 'Will'] as const;
const SAVE_ABILITY: Record<string, Ability> = { Fortitude: 'CON', Reflex: 'DEX', Will: 'WIS' };

const FEAT_TYPES = ['Ancestry', 'Class', 'Skill', 'General'] as const;

interface PFFeat { name: string; type: string; level: number; notes: string }

function calcMod(score: number): number { return Math.floor((score - 10) / 2); }
function formatMod(m: number): string { return m >= 0 ? `+${m}` : `${m}`; }

export default function PFCharacterSheet() {
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
  const [spells, setSpells] = useState<SpellRow[]>([]);
  const [spellSlots, setSpellSlots] = useState<Record<string, { total: number; expended: number }>>({});
  const [pfProfs, setPfProfs] = useState<Record<string, string>>({});
  const [pfFeats, setPfFeats] = useState<PFFeat[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (character && !loaded.current) {
      loaded.current = true;
      const { equipment: eq, spells: sp, spell_slots: ss, pf_proficiencies, pf_feats, ...rest } = character;
      setForm(rest);
      setEquipment((eq as EquipmentItem[]) ?? []);
      setSpells((sp as SpellRow[]) ?? []);
      setSpellSlots((ss as Record<string, { total: number; expended: number }>) ?? {});
      setPfProfs((pf_proficiencies as Record<string, string>) ?? {});
      setPfFeats((pf_feats as PFFeat[]) ?? []);
    }
  }, [character]);

  const featuresEditor = useEditor({
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
    if (featuresEditor && character?.features_traits && !featuresEditor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      featuresEditor.commands.setContent(character.features_traits);
    }
  }, [featuresEditor, character]);

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
      spells,
      spell_slots: spellSlots,
      pf_proficiencies: pfProfs,
      pf_feats: pfFeats,
      features_traits: featuresEditor?.getHTML() ?? '',
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
  }, [characterId, form, equipment, spells, spellSlots, pfProfs, pfFeats, featuresEditor, notesEditor]);

  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded.current || saveStatus === 'saving' || isReadOnly) return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => handleSave(), 5000);
    return () => clearTimeout(autosaveRef.current);
  }, [form, equipment, spells, spellSlots, pfProfs, pfFeats]);

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
                  <label className="text-xs text-muted-foreground">Ancestry</label>
                  <Input value={(form.race as string) ?? ''} onChange={(e) => set('race', e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Heritage</label>
                  <Input value={(form.pf_heritage as string) ?? ''} onChange={(e) => set('pf_heritage' as any, e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Class</label>
                  <Input value={(form.class as string) ?? ''} onChange={(e) => set('class', e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Subclass</label>
                  <Input value={(form.subclass as string) ?? ''} onChange={(e) => set('subclass', e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Background</label>
                  <Input value={(form.background as string) ?? ''} onChange={(e) => set('background', e.target.value)} className="bg-muted border-border" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Level</label>
                    <Input type="number" min={1} max={20} value={level} onChange={(e) => setNum('level', e.target.value)} className="bg-muted border-border" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Key Ability</label>
                    <Select value={(form.pf_key_ability as string) ?? ''} onValueChange={(v) => set('pf_key_ability' as any, v)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {ABILITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ability Scores */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Ability Scores</h3>
            <div className="grid grid-cols-6 gap-3">
              {ABILITIES.map((ab) => (
                <div key={ab} className="text-center bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground font-heading mb-1">{ab}</div>
                  <div className="text-xl font-heading text-foreground mb-1">{formatMod(mods[ab])}</div>
                  <Input type="number" min={1} max={30} value={scores[ab]} onChange={(e) => setNum(ABILITY_KEY[ab], e.target.value)} className="h-8 text-center text-sm bg-background border-border" />
                </div>
              ))}
            </div>
          </section>

          {/* Combat Stats & Hero Points */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Combat & Hero Points</h3>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {([['AC', 'armor_class'], ['Speed', 'speed'], ['Max HP', 'max_hp'], ['Current HP', 'current_hp'], ['Temp HP', 'temp_hp']] as [string, keyof CharacterRow][]).map(([label, key]) => (
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
                  <span className="text-sm font-heading text-foreground">{formatMod(getProfTotal('Perception', 'WIS'))}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hero Points</label>
                <div className="flex items-center gap-2 mt-1">
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 border-border" onClick={() => set('pf_hero_points' as any, Math.max(0, ((form.pf_hero_points as number) ?? 1) - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-heading text-lg text-foreground w-4 text-center">{(form.pf_hero_points as number) ?? 1}</span>
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 border-border" onClick={() => set('pf_hero_points' as any, Math.min(3, ((form.pf_hero_points as number) ?? 1) + 1))}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Saving Throws */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Saving Throws</h3>
            <div className="grid grid-cols-3 gap-3">
              {SAVES.map((save) => (
                <div key={save} className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground font-heading mb-1">{save}</div>
                  <div className="text-lg font-heading text-foreground mb-1">{formatMod(getProfTotal(save, SAVE_ABILITY[save]))}</div>
                  <Select value={pfProfs[save] ?? 'untrained'} onValueChange={(v) => { setPfProfs((p) => ({ ...p, [save]: v })); setSaveStatus('idle'); }}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs justify-center"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROF_RANKS.map((r) => <SelectItem key={r} value={r}>{PROF_LABELS[r]} — {r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PF_SKILLS.map((skill) => {
                const ability = PF_SKILL_ABILITY[skill];
                const rank = pfProfs[skill] ?? 'untrained';
                const total = getProfTotal(skill, ability);
                return (
                  <div key={skill} className="flex items-center gap-2 bg-muted rounded px-3 py-1.5">
                    <span className="text-sm text-foreground flex-1">{skill} <span className="text-xs text-muted-foreground">({ability})</span></span>
                    <Select value={rank} onValueChange={(v) => { setPfProfs((p) => ({ ...p, [skill]: v })); setSaveStatus('idle'); }}>
                      <SelectTrigger className="bg-background border-border h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROF_RANKS.map((r) => <SelectItem key={r} value={r}>{PROF_LABELS[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-heading text-foreground w-8 text-right">{formatMod(total)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Feats */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Feats</h3>
            {FEAT_TYPES.map((type) => {
              const featsOfType = pfFeats.filter((f) => f.type === type);
              return (
                <Collapsible key={type} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1 text-sm font-heading text-muted-foreground hover:text-foreground">
                    <ChevronDown className="w-3.5 h-3.5" />
                    {type} Feats ({featsOfType.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1 mb-3">
                    {pfFeats.map((feat, i) => {
                      if (feat.type !== type) return null;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <Input value={feat.name} onChange={(e) => { const c = [...pfFeats]; c[i] = { ...c[i], name: e.target.value }; setPfFeats(c); setSaveStatus('idle'); }} placeholder="Feat name" className="bg-muted border-border flex-1" />
                          <Input type="number" value={feat.level} onChange={(e) => { const c = [...pfFeats]; c[i] = { ...c[i], level: Number(e.target.value) }; setPfFeats(c); setSaveStatus('idle'); }} placeholder="Lvl" className="bg-muted border-border w-16" />
                          <Input value={feat.notes} onChange={(e) => { const c = [...pfFeats]; c[i] = { ...c[i], notes: e.target.value }; setPfFeats(c); setSaveStatus('idle'); }} placeholder="Notes" className="bg-muted border-border flex-1" />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setPfFeats(pfFeats.filter((_, j) => j !== i)); setSaveStatus('idle'); }}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => { setPfFeats([...pfFeats, { name: '', type, level: level, notes: '' }]); setSaveStatus('idle'); }}>
                      <Plus className="w-3 h-3 mr-1" /> Add {type} Feat
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </section>

          {/* Equipment */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Equipment</h3>
            <div className="space-y-2">
              {equipment.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.name} onChange={(e) => { const c = [...equipment]; c[i] = { ...c[i], name: e.target.value }; setEquipment(c); setSaveStatus('idle'); }} placeholder="Item name" className="bg-muted border-border flex-1" />
                  <Input type="number" value={item.quantity} onChange={(e) => { const c = [...equipment]; c[i] = { ...c[i], quantity: Number(e.target.value) }; setEquipment(c); setSaveStatus('idle'); }} className="bg-muted border-border w-16" placeholder="Qty" />
                  <Input type="number" value={item.weight} onChange={(e) => { const c = [...equipment]; c[i] = { ...c[i], weight: Number(e.target.value) }; setEquipment(c); setSaveStatus('idle'); }} className="bg-muted border-border w-20" placeholder="Bulk" />
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

          {/* Features & Traits (Edges equivalent) */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Special Abilities & Features</h3>
            <div className="bg-muted rounded-md border border-border">
              <EditorContent editor={featuresEditor} />
            </div>
          </section>

          {/* Personality */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Personality</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Personality Traits</label>
                <Textarea value={(form.personality_traits as string) ?? ''} onChange={(e) => set('personality_traits', e.target.value)} className="bg-muted border-border mt-1" rows={3} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ideals</label>
                <Textarea value={(form.ideals as string) ?? ''} onChange={(e) => set('ideals', e.target.value)} className="bg-muted border-border mt-1" rows={3} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bonds</label>
                <Textarea value={(form.bonds as string) ?? ''} onChange={(e) => set('bonds', e.target.value)} className="bg-muted border-border mt-1" rows={3} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Flaws</label>
                <Textarea value={(form.flaws as string) ?? ''} onChange={(e) => set('flaws', e.target.value)} className="bg-muted border-border mt-1" rows={3} />
              </div>
            </div>
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

      <footer className="border-t border-border px-4 py-3 flex items-center gap-3">
        <Button onClick={handleSave} disabled={isReadOnly} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
          <Save className="w-4 h-4" /> Save
        </Button>
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
