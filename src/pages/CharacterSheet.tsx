import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter, useUpdateCharacter, useDeleteCharacter, uploadAvatarImage, type CharacterRow, type EquipmentItem, type SpellRow } from '@/hooks/useCharacters';
import { useAdventure } from '@/hooks/useAdventure';
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
import { ArrowLeft, Save, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
type Ability = typeof ABILITIES[number];
const ABILITY_KEY: Record<Ability, keyof CharacterRow> = {
  STR: 'str_score', DEX: 'dex_score', CON: 'con_score', INT: 'int_score', WIS: 'wis_score', CHA: 'cha_score',
};

const SKILLS: { name: string; ability: Ability }[] = [
  { name: 'Acrobatics', ability: 'DEX' }, { name: 'Animal Handling', ability: 'WIS' },
  { name: 'Arcana', ability: 'INT' }, { name: 'Athletics', ability: 'STR' },
  { name: 'Deception', ability: 'CHA' }, { name: 'History', ability: 'INT' },
  { name: 'Insight', ability: 'WIS' }, { name: 'Intimidation', ability: 'CHA' },
  { name: 'Investigation', ability: 'INT' }, { name: 'Medicine', ability: 'WIS' },
  { name: 'Nature', ability: 'INT' }, { name: 'Perception', ability: 'WIS' },
  { name: 'Performance', ability: 'CHA' }, { name: 'Persuasion', ability: 'CHA' },
  { name: 'Religion', ability: 'INT' }, { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' }, { name: 'Survival', ability: 'WIS' },
];

function calcMod(score: number): number { return Math.floor((score - 10) / 2); }
function profBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}
function formatMod(m: number): string { return m >= 0 ? `+${m}` : `${m}`; }

export default function CharacterSheet() {
  const { adventureId, characterId } = useParams<{ adventureId: string; characterId: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading } = useCharacter(characterId);
  const { data: adventure } = useAdventure(adventureId);
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const [form, setForm] = useState<Partial<CharacterRow>>({});
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [spells, setSpells] = useState<SpellRow[]>([]);
  const [spellSlots, setSpellSlots] = useState<Record<string, { total: number; expended: number }>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (character && !loaded.current) {
      loaded.current = true;
      const { equipment: eq, spells: sp, spell_slots: ss, ...rest } = character;
      setForm(rest);
      setEquipment((eq as EquipmentItem[]) ?? []);
      setSpells((sp as SpellRow[]) ?? []);
      setSpellSlots((ss as Record<string, { total: number; expended: number }>) ?? {});
    }
  }, [character]);

  const featuresEditor = useEditor({
    extensions: [StarterKit],
    content: character?.features_traits ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[150px] focus:outline-none p-3' } },
  });

  const notesEditor = useEditor({
    extensions: [StarterKit],
    content: character?.notes ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[150px] focus:outline-none p-3' } },
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
    if (!characterId) return;
    setSaveStatus('saving');
    const payload: Record<string, unknown> = {
      ...form,
      equipment,
      spells,
      spell_slots: spellSlots,
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
  }, [characterId, form, equipment, spells, spellSlots, featuresEditor, notesEditor]);

  // Autosave
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded.current || saveStatus === 'saving') return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => { handleSave(); }, 5000);
    return () => clearTimeout(autosaveRef.current);
  }, [form, equipment, spells, spellSlots]);

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
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const level = (form.level as number) ?? 1;
  const pb = profBonus(level);
  const scores: Record<Ability, number> = {
    STR: (form.str_score as number) ?? 10,
    DEX: (form.dex_score as number) ?? 10,
    CON: (form.con_score as number) ?? 10,
    INT: (form.int_score as number) ?? 10,
    WIS: (form.wis_score as number) ?? 10,
    CHA: (form.cha_score as number) ?? 10,
  };
  const mods: Record<Ability, number> = {} as any;
  ABILITIES.forEach((a) => { mods[a] = calcMod(scores[a]); });

  const saveProficiencies = (form.saving_throw_proficiencies as string[]) ?? [];
  const skillProfs = (form.skill_proficiencies as string[]) ?? [];
  const skillHalfProfs = (form.skill_half_proficiencies as string[]) ?? [];

  const toggleArrayItem = (key: keyof CharacterRow, arr: string[], item: string) => {
    set(key, (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]) as any);
  };

  // Spell save DC and attack bonus
  const scAbility = (form.spellcasting_ability as string) ?? 'INT';
  const scMod = mods[scAbility as Ability] ?? 0;
  const spellSaveDC = 8 + pb + scMod;
  const spellAtkBonus = pb + scMod;

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-foreground">Loading…</div>;
  if (!character) return <div className="min-h-screen bg-background p-8 text-foreground">Character not found</div>;

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
              <BreadcrumbItem><BreadcrumbPage>{form.name || 'Character'}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Badge variant={saveStatus === 'saved' ? 'secondary' : saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
        </Badge>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Header Row ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-4">
              {/* Avatar */}
              <label className="cursor-pointer flex-shrink-0">
                <Avatar className="w-20 h-20">
                  {form.avatar_url ? <AvatarImage src={form.avatar_url as string} /> : null}
                  <AvatarFallback className="bg-muted text-muted-foreground font-heading text-lg">{(form.name as string)?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={(form.name as string) ?? ''} onChange={(e) => set('name', e.target.value)} className="font-heading text-lg bg-muted border-border" />
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
                  <label className="text-xs text-muted-foreground">Race</label>
                  <Input value={(form.race as string) ?? ''} onChange={(e) => set('race', e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Background</label>
                  <Input value={(form.background as string) ?? ''} onChange={(e) => set('background', e.target.value)} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Alignment</label>
                  <Input value={(form.alignment as string) ?? ''} onChange={(e) => set('alignment', e.target.value)} className="bg-muted border-border" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Level</label>
                    <Input type="number" min={1} max={20} value={(form.level as number) ?? 1} onChange={(e) => setNum('level', e.target.value)} className="bg-muted border-border" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">XP</label>
                    <Input type="number" min={0} value={(form.experience_points as number) ?? 0} onChange={(e) => setNum('experience_points', e.target.value)} className="bg-muted border-border" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Ability Scores ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm text-gold">Ability Scores</h3>
              <Badge variant="outline" className="border-gold/40 text-gold">Proficiency Bonus: {formatMod(pb)}</Badge>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {ABILITIES.map((ab) => (
                <div key={ab} className="text-center bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground font-heading mb-1">{ab}</div>
                  <div className="text-xl font-heading text-foreground mb-1">{formatMod(mods[ab])}</div>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={scores[ab]}
                    onChange={(e) => setNum(ABILITY_KEY[ab], e.target.value)}
                    className="h-8 text-center text-sm bg-background border-border"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── Combat Stats ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Combat</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {([
                ['Armor Class', 'armor_class'],
                ['Initiative', 'initiative_override'],
                ['Speed', 'speed'],
                ['Max HP', 'max_hp'],
                ['Current HP', 'current_hp'],
                ['Temp HP', 'temp_hp'],
              ] as [string, keyof CharacterRow][]).map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <Input
                    type="number"
                    value={(form[key] as number) ?? (key === 'initiative_override' ? '' : 0)}
                    onChange={(e) => setNum(key, e.target.value)}
                    placeholder={key === 'initiative_override' ? formatMod(mods.DEX) : undefined}
                    className="bg-muted border-border"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="text-xs text-muted-foreground">Hit Dice</label>
                <Input value={(form.hit_dice as string) ?? ''} onChange={(e) => set('hit_dice', e.target.value)} placeholder="e.g. 4d8" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Death Save Successes</label>
                <div className="flex gap-2 mt-1">
                  {[0, 1, 2].map((i) => (
                    <Checkbox
                      key={i}
                      checked={((form.death_save_successes as number) ?? 0) > i}
                      onCheckedChange={() => set('death_save_successes', (((form.death_save_successes as number) ?? 0) > i ? i : i + 1) as any)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Death Save Failures</label>
                <div className="flex gap-2 mt-1">
                  {[0, 1, 2].map((i) => (
                    <Checkbox
                      key={i}
                      checked={((form.death_save_failures as number) ?? 0) > i}
                      onCheckedChange={() => set('death_save_failures', (((form.death_save_failures as number) ?? 0) > i ? i : i + 1) as any)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Saving Throws & Skills ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saving Throws */}
            <section className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-heading text-sm text-gold mb-3">Saving Throws</h3>
              <div className="space-y-1.5">
                {ABILITIES.map((ab) => {
                  const prof = saveProficiencies.includes(ab);
                  const bonus = mods[ab] + (prof ? pb : 0);
                  return (
                    <div key={ab} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={prof} onCheckedChange={() => toggleArrayItem('saving_throw_proficiencies', saveProficiencies, ab)} />
                      <span className="w-8 text-right font-mono text-foreground">{formatMod(bonus)}</span>
                      <span className="text-muted-foreground">{ab}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Skills */}
            <section className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-heading text-sm text-gold mb-3">Skills</h3>
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                {SKILLS.map((skill) => {
                  const prof = skillProfs.includes(skill.name);
                  const half = skillHalfProfs.includes(skill.name);
                  const bonus = mods[skill.ability] + (prof ? pb : half ? Math.floor(pb / 2) : 0);
                  return (
                    <div key={skill.name} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={prof} onCheckedChange={() => toggleArrayItem('skill_proficiencies', skillProfs, skill.name)} title="Proficient" />
                      <Checkbox checked={half} onCheckedChange={() => toggleArrayItem('skill_half_proficiencies', skillHalfProfs, skill.name)} title="Half-proficient" className="h-3 w-3" />
                      <span className="w-8 text-right font-mono text-foreground">{formatMod(bonus)}</span>
                      <span className="text-foreground flex-1 truncate">{skill.name}</span>
                      <span className="text-xs text-muted-foreground">({skill.ability})</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Proficiencies & Languages ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Proficiencies & Languages</h3>
            <Textarea
              value={(form.proficiencies_languages as string) ?? ''}
              onChange={(e) => set('proficiencies_languages', e.target.value)}
              className="bg-muted border-border min-h-[80px]"
              placeholder="Languages, armor, weapons, tools…"
            />
          </section>

          {/* ── Equipment ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Equipment & Inventory</h3>
            <div className="space-y-2">
              {equipment.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => { const copy = [...equipment]; copy[i] = { ...copy[i], name: e.target.value }; setEquipment(copy); setSaveStatus('idle'); }}
                    placeholder="Item name"
                    className="bg-muted border-border flex-1"
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => { const copy = [...equipment]; copy[i] = { ...copy[i], quantity: Number(e.target.value) }; setEquipment(copy); setSaveStatus('idle'); }}
                    className="bg-muted border-border w-16"
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    value={item.weight}
                    onChange={(e) => { const copy = [...equipment]; copy[i] = { ...copy[i], weight: Number(e.target.value) }; setEquipment(copy); setSaveStatus('idle'); }}
                    className="bg-muted border-border w-16"
                    placeholder="Wt"
                  />
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

          {/* ── Features, Traits & Abilities ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Features, Traits & Abilities</h3>
            <div className="bg-muted rounded-md border border-border">
              <EditorContent editor={featuresEditor} />
            </div>
          </section>

          {/* ── Spells ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Spellcasting</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground">Spellcasting Ability</label>
                <Select value={(form.spellcasting_ability as string) ?? 'INT'} onValueChange={(v) => set('spellcasting_ability', v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{ABILITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Spell Save DC</label>
                <div className="h-10 flex items-center font-heading text-lg text-foreground">{spellSaveDC}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Spell Attack Bonus</label>
                <div className="h-10 flex items-center font-heading text-lg text-foreground">{formatMod(spellAtkBonus)}</div>
              </div>
            </div>

            {/* Spell Slots */}
            <div className="mb-4">
              <h4 className="text-xs text-muted-foreground mb-2">Spell Slots</h4>
              <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((lvl) => {
                  const key = String(lvl);
                  const slot = spellSlots[key] ?? { total: 0, expended: 0 };
                  return (
                    <div key={lvl} className="text-center bg-muted rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">Lv {lvl}</div>
                      <Input
                        type="number"
                        min={0}
                        value={slot.total}
                        onChange={(e) => {
                          const copy = { ...spellSlots, [key]: { ...slot, total: Number(e.target.value) } };
                          setSpellSlots(copy);
                          setSaveStatus('idle');
                        }}
                        className="h-7 text-xs text-center bg-background border-border mb-1"
                      />
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: slot.total }, (_, j) => (
                          <Checkbox
                            key={j}
                            checked={slot.expended > j}
                            onCheckedChange={() => {
                              const copy = { ...spellSlots, [key]: { ...slot, expended: slot.expended > j ? j : j + 1 } };
                              setSpellSlots(copy);
                              setSaveStatus('idle');
                            }}
                            className="h-3 w-3"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spell List */}
            <div className="space-y-2">
              {spells.map((spell, i) => (
                <div key={spell.id} className="flex flex-wrap items-center gap-2 bg-muted rounded p-2">
                  <Checkbox
                    checked={spell.prepared}
                    onCheckedChange={(v) => { const c = [...spells]; c[i] = { ...c[i], prepared: !!v }; setSpells(c); setSaveStatus('idle'); }}
                    title="Prepared"
                  />
                  <Input value={spell.name} onChange={(e) => { const c = [...spells]; c[i] = { ...c[i], name: e.target.value }; setSpells(c); setSaveStatus('idle'); }} placeholder="Spell name" className="bg-background border-border flex-1 min-w-[120px] h-8 text-sm" />
                  <Input type="number" min={0} max={9} value={spell.level} onChange={(e) => { const c = [...spells]; c[i] = { ...c[i], level: Number(e.target.value) }; setSpells(c); setSaveStatus('idle'); }} className="bg-background border-border w-14 h-8 text-sm" placeholder="Lv" />
                  <Input value={spell.school} onChange={(e) => { const c = [...spells]; c[i] = { ...c[i], school: e.target.value }; setSpells(c); setSaveStatus('idle'); }} placeholder="School" className="bg-background border-border w-24 h-8 text-sm" />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Checkbox checked={spell.concentration} onCheckedChange={(v) => { const c = [...spells]; c[i] = { ...c[i], concentration: !!v }; setSpells(c); setSaveStatus('idle'); }} className="h-3 w-3" /> C
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Checkbox checked={spell.ritual} onCheckedChange={(v) => { const c = [...spells]; c[i] = { ...c[i], ritual: !!v }; setSpells(c); setSaveStatus('idle'); }} className="h-3 w-3" /> R
                  </label>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSpells(spells.filter((_, j) => j !== i)); setSaveStatus('idle'); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-border text-muted-foreground"
              onClick={() => { setSpells([...spells, { id: crypto.randomUUID(), prepared: false, name: '', level: 0, school: '', concentration: false, ritual: false, notes: '' }]); setSaveStatus('idle'); }}
            >
              <Plus className="w-3 h-3 mr-1" /> Add Spell
            </Button>
          </section>

          {/* ── Personality ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Personality</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['personality_traits', 'ideals', 'bonds', 'flaws'] as const).map((key) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</label>
                  <Textarea
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                    className="bg-muted border-border min-h-[60px]"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── Notes ── */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Character Notes & Session Lore</h3>
            <div className="bg-muted rounded-md border border-border">
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
