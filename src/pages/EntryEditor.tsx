import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdventure } from '@/hooks/useAdventure';
import { useEntry, useCreateEntry, useUpdateEntry, useDeleteEntry, useEntries } from '@/hooks/useEntries';
import { useCharacters } from '@/hooks/useCharacters';
import { useLocations } from '@/hooks/useLocations';
import {
  useEntryCharacters, useLinkCharacter, useUnlinkCharacter,
  useEntryLocations, useLinkLocation, useUnlinkLocation,
} from '@/hooks/useEntryLinks';
import { useEditor, EditorContent } from '@tiptap/react';
import { EditorToolbar } from '@/components/EditorToolbar';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DeleteEntryDialog } from '@/components/DeleteEntryDialog';
import { ArrowLeft, X, Save, MapPin, User, Search, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import type { CharacterRow } from '@/hooks/useCharacters';
import type { LocationRow } from '@/hooks/useLocations';

export default function EntryEditor() {
  const { adventureId, entryId } = useParams<{ adventureId: string; entryId: string }>();
  const navigate = useNavigate();
  const isNew = entryId === 'new';
  const isMobile = useIsMobile();

  const { data: adventure } = useAdventure(adventureId);
  const { data: existingEntry } = useEntry(isNew ? undefined : entryId);
  const { data: entries } = useEntries(adventureId!);
  const { data: characters } = useCharacters(adventureId!);
  const { data: locations } = useLocations(adventureId!);
  const { data: linkedCharIds } = useEntryCharacters(isNew ? undefined : entryId);
  const { data: linkedLocIds } = useEntryLocations(isNew ? undefined : entryId);

  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const linkChar = useLinkCharacter();
  const unlinkChar = useUnlinkCharacter();
  const linkLoc = useLinkLocation();
  const unlinkLoc = useUnlinkLocation();

  const [title, setTitle] = useState('');
  const [sessionNumber, setSessionNumber] = useState<number | ''>('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [charSearch, setCharSearch] = useState('');
  const [locSearch, setLocSearch] = useState('');
  const [sheetChar, setSheetChar] = useState<CharacterRow | null>(null);
  const [sheetLoc, setSheetLoc] = useState<LocationRow | null>(null);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const [realEntryId, setRealEntryId] = useState<string | undefined>(isNew ? undefined : entryId);
  const creatingRef = useRef(false);

  // Auto-increment session number for new entries (per adventure)
  useEffect(() => {
    if (isNew && entries && sessionNumber === '') {
      const max = entries.reduce((m, e) => Math.max(m, e.session_number ?? 0), 0);
      setSessionNumber(max + 1);
    }
  }, [isNew, entries]);

  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title);
      setSessionNumber(existingEntry.session_number ?? '');
      setDateStart(existingEntry.session_date_start ?? '');
      setDateEnd(existingEntry.session_date_end ?? '');
      setIsRange(!!(existingEntry.session_date_end && existingEntry.session_date_end !== existingEntry.session_date_start));
    }
  }, [existingEntry]);

  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { style: 'max-width:100%;height:auto;display:block;margin-left:0;margin-right:auto;cursor:pointer;' } })],
    content: existingEntry?.story_content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3',
      },
    },
  });

  useEffect(() => {
    if (editor && existingEntry?.story_content && !editor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      editor.commands.setContent(existingEntry.story_content);
    }
  }, [editor, existingEntry]);

  // Autosave every 3s
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!realEntryId || !editor) return;
    const handler = () => {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        setSaveStatus('saving');
        updateEntry.mutate(
          { id: realEntryId, story_content: editor.getHTML(), title: title || 'Untitled', session_number: sessionNumber === '' ? undefined : Number(sessionNumber), session_date_start: dateStart || undefined, session_date_end: isRange ? dateEnd || undefined : undefined },
          { onSuccess: () => setSaveStatus('saved'), onError: () => { setSaveStatus('idle'); toast.error('Autosave failed'); } }
        );
      }, 3000);
    };
    editor.on('update', handler);
    return () => { editor.off('update', handler); clearTimeout(autosaveTimer.current); };
  }, [realEntryId, editor, title, sessionNumber, dateStart, dateEnd, isRange]);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    const payload = {
      title: title || 'Untitled',
      story_content: editor?.getHTML() ?? '',
      session_number: sessionNumber === '' ? undefined : Number(sessionNumber),
      session_date_start: dateStart || undefined,
      session_date_end: isRange ? dateEnd || undefined : undefined,
    };

    if (realEntryId) {
      updateEntry.mutate({ id: realEntryId, ...payload }, {
        onSuccess: () => { setSaveStatus('saved'); toast.success('Entry saved'); },
        onError: () => { setSaveStatus('idle'); toast.error('Failed to save'); },
      });
    } else {
      if (creatingRef.current) return;
      creatingRef.current = true;
      createEntry.mutate({ adventure_id: adventureId!, ...payload }, {
        onSuccess: (data) => {
          setRealEntryId(data.id);
          setSaveStatus('saved');
          toast.success('Entry created');
          window.history.replaceState(null, '', `/adventure/${adventureId}/entry/${data.id}`);
          creatingRef.current = false;
        },
        onError: () => { setSaveStatus('idle'); creatingRef.current = false; toast.error('Failed to create'); },
      });
    }
  }, [title, editor, sessionNumber, dateStart, dateEnd, isRange, realEntryId, adventureId]);

  const handleDelete = () => {
    if (!realEntryId) return;
    deleteEntry.mutate({ id: realEntryId, adventureId: adventureId! }, {
      onSuccess: () => { navigate(`/adventure/${adventureId}`); toast.success('Entry deleted'); },
    });
  };

  const linkedChars = characters?.filter((c) => linkedCharIds?.includes(c.id)) ?? [];
  const linkedLocs = locations?.filter((l) => linkedLocIds?.includes(l.id)) ?? [];
  const filteredChars = characters?.filter((c) => !linkedCharIds?.includes(c.id) && c.name.toLowerCase().includes(charSearch.toLowerCase())) ?? [];
  const filteredLocs = locations?.filter((l) => !linkedLocIds?.includes(l.id) && l.name.toLowerCase().includes(locSearch.toLowerCase())) ?? [];

  // Sidebar content components (reused for both desktop sidebar and mobile drawer)
  const leftSidebarContent = (
    <>
      {/* Characters */}
      <div className="mb-6">
        <h3 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <User className="w-3 h-3" /> Characters
        </h3>
        {linkedChars.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-2 text-xs mb-1.5 px-2 py-1 rounded cursor-pointer group/chip ${
              c.type === 'PC' ? 'bg-blue-900/30 text-blue-300' : 'bg-amber-900/30 text-amber-300'
            }`}
            onClick={() => setSheetChar(c)}
          >
            <Avatar className="w-5 h-5">
              {c.avatar_url ? <AvatarImage src={c.avatar_url} /> : null}
              <AvatarFallback className="text-[8px] bg-transparent">{c.name[0]}</AvatarFallback>
            </Avatar>
            <span className="truncate flex-1">{c.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); if (realEntryId) unlinkChar.mutate({ entryId: realEntryId, characterId: c.id }); }}
              className="opacity-0 group-hover/chip:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {realEntryId && (
          <div className="mt-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Add character…"
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                className="h-7 text-xs pl-7 bg-muted border-border"
              />
            </div>
            {charSearch && filteredChars.length > 0 && (
              <div className="mt-1 bg-popover border border-border rounded-md max-h-32 overflow-y-auto">
                {filteredChars.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-accent text-foreground"
                    onClick={() => { linkChar.mutate({ entryId: realEntryId, characterId: c.id }); setCharSearch(''); }}
                  >
                    {c.name} <span className="text-muted-foreground">({c.type})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Locations */}
      <div>
        <h3 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Locations
        </h3>
        {linkedLocs.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-2 text-xs mb-1.5 px-2 py-1 rounded bg-muted cursor-pointer group/chip text-foreground"
            onClick={() => setSheetLoc(l)}
          >
            {l.image_url ? (
              <img src={l.image_url} className="w-5 h-5 rounded object-cover" alt={l.name} />
            ) : (
              <MapPin className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="truncate flex-1">{l.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); if (realEntryId) unlinkLoc.mutate({ entryId: realEntryId, locationId: l.id }); }}
              className="opacity-0 group-hover/chip:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {realEntryId && (
          <div className="mt-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Add location…"
                value={locSearch}
                onChange={(e) => setLocSearch(e.target.value)}
                className="h-7 text-xs pl-7 bg-muted border-border"
              />
            </div>
            {locSearch && filteredLocs.length > 0 && (
              <div className="mt-1 bg-popover border border-border rounded-md max-h-32 overflow-y-auto">
                {filteredLocs.map((l) => (
                  <button
                    key={l.id}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-accent text-foreground"
                    onClick={() => { linkLoc.mutate({ entryId: realEntryId, locationId: l.id }); setLocSearch(''); }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  const rightSidebarContent = (
    <>
      <h3 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-3">Session Date</h3>
      <div className="flex items-center gap-2 mb-3">
        <Switch checked={isRange} onCheckedChange={setIsRange} id="date-range" />
        <Label htmlFor="date-range" className="text-xs text-muted-foreground">Date Range</Label>
      </div>
      <Input
        value={dateStart}
        onChange={(e) => setDateStart(e.target.value)}
        placeholder={isRange ? 'Start date…' : 'Session date…'}
        className="h-8 text-xs bg-muted border-border mb-2"
      />
      {isRange && (
        <Input
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          placeholder="End date…"
          className="h-8 text-xs bg-muted border-border mb-2"
        />
      )}
      <h3 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2 mt-4">Session #</h3>
      <Input
        type="number"
        value={sessionNumber}
        onChange={(e) => setSessionNumber(e.target.value === '' ? '' : Number(e.target.value))}
        className="h-8 text-xs bg-muted border-border"
      />
    </>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Breadcrumb + save status */}
      <header className="border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/adventure/${adventureId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href={`/adventure/${adventureId}`}>{adventure?.title ?? '...'}</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{title || 'New Entry'}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Badge variant={saveStatus === 'saved' ? 'secondary' : saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
        </Badge>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — desktop only */}
        <aside className="w-[200px] flex-shrink-0 border-r border-border p-3 overflow-y-auto hidden md:block">
          {leftSidebarContent}
        </aside>

        {/* Center editor */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="px-6 pt-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title…"
              className="text-2xl font-heading bg-transparent border-none focus-visible:ring-0 px-0 text-gold placeholder:text-muted-foreground"
            />
          </div>
          <EditorToolbar editor={editor} />
          <div className="flex-1 overflow-y-auto px-2">
            <EditorContent editor={editor} className="min-h-[400px]" />
          </div>
        </main>

        {/* Right sidebar — desktop only */}
        <aside className="w-[180px] flex-shrink-0 border-l border-border p-3 overflow-y-auto hidden md:block">
          {rightSidebarContent}
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-3 flex items-center gap-3">
        {/* Mobile toolbar buttons */}
        {isMobile && (
          <>
            <Button variant="outline" size="icon" onClick={() => setMobileLeftOpen(true)} title="Characters & Locations" className="border-border md:hidden">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setMobileRightOpen(true)} title="Session Details" className="border-border md:hidden">
              <CalendarDays className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button onClick={handleSave} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
          <Save className="w-4 h-4" /> Save
        </Button>
        <Button variant="outline" onClick={() => navigate(`/adventure/${adventureId}`)} className="border-border">
          Cancel
        </Button>
        {realEntryId && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
            Delete Entry
          </Button>
        )}
      </footer>

      {/* Mobile left drawer */}
      <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
        <SheetContent side="left" className="bg-card border-border w-[260px]">
          <SheetHeader>
            <SheetTitle className="font-heading text-gold">Characters & Locations</SheetTitle>
            <SheetDescription>Link characters and locations to this entry.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {leftSidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile right drawer */}
      <Sheet open={mobileRightOpen} onOpenChange={setMobileRightOpen}>
        <SheetContent side="right" className="bg-card border-border w-[260px]">
          <SheetHeader>
            <SheetTitle className="font-heading text-gold">Session Details</SheetTitle>
            <SheetDescription>Set the session date and number.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {rightSidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      {/* Character sheet slide-over */}
      <Sheet open={!!sheetChar} onOpenChange={(o) => { if (!o) setSheetChar(null); }}>
        <SheetContent className="bg-card border-border">
          <SheetHeader>
            <SheetTitle className="font-heading text-gold">{sheetChar?.name}</SheetTitle>
            <SheetDescription>{sheetChar?.type === 'PC' ? 'Player Character' : 'Non-Player Character'}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm text-foreground">
            {sheetChar?.avatar_url && (
              <Avatar className="w-16 h-16">
                <AvatarImage src={sheetChar.avatar_url} />
                <AvatarFallback className="font-heading">{sheetChar.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            )}
            {sheetChar?.type === 'PC' && (
              <div className="space-y-1 text-xs text-muted-foreground">
                {sheetChar.class && <p>Class: <span className="text-foreground">{sheetChar.class}{sheetChar.subclass ? ` (${sheetChar.subclass})` : ''}</span></p>}
                {sheetChar.race && <p>Race: <span className="text-foreground">{sheetChar.race}</span></p>}
                {sheetChar.level && <p>Level: <span className="text-foreground">{sheetChar.level}</span></p>}
              </div>
            )}
            {sheetChar?.type === 'NPC' && sheetChar.role_occupation && (
              <p className="text-xs text-muted-foreground">Role: <span className="text-foreground">{sheetChar.role_occupation}</span></p>
            )}
            {sheetChar?.notes && <p>{sheetChar.notes}</p>}
            <Button variant="link" className="text-gold p-0" onClick={() => navigate(`/adventure/${adventureId}/character/${sheetChar?.id}`)}>
              Open full sheet →
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Location detail slide-over */}
      <Sheet open={!!sheetLoc} onOpenChange={(o) => { if (!o) setSheetLoc(null); }}>
        <SheetContent className="bg-card border-border">
          <SheetHeader>
            <SheetTitle className="font-heading text-gold">{sheetLoc?.name}</SheetTitle>
            <SheetDescription>{sheetLoc?.type ?? 'Location'}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm text-foreground">
            {sheetLoc?.image_url && <img src={sheetLoc.image_url} className="w-full rounded-md" alt={sheetLoc.name} />}
            {sheetLoc?.description && <p>{sheetLoc.description}</p>}
            {sheetLoc?.notes && <p className="text-muted-foreground">{sheetLoc.notes}</p>}
            <Button variant="link" className="text-gold p-0" onClick={() => navigate(`/adventure/${adventureId}/location/${sheetLoc?.id}`)}>
              Open full location →
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DeleteEntryDialog
        entry={existingEntry ?? { id: '', adventure_id: adventureId!, title, story_content: null, session_date_start: null, session_date_end: null, session_number: null, created_at: '', updated_at: '' }}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
