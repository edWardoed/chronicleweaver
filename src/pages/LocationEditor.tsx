import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation, useUpdateLocation, useDeleteLocation, uploadLocationImage, type LocationRow } from '@/hooks/useLocations';
import { useAdventure } from '@/hooks/useAdventure';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAdventureRole } from '@/hooks/useAdventureRole';
import { ArrowLeft, Save, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_LOCATION_TYPES = ['City', 'Town', 'Village', 'Dungeon', 'Ruins', 'Wilderness', 'Building', 'Landmark', 'Region', 'Other'];

export default function LocationEditor() {
  const { adventureId, locationId } = useParams<{ adventureId: string; locationId: string }>();
  const navigate = useNavigate();
  const { data: location, isLoading } = useLocation(locationId);
  const { data: adventure } = useAdventure(adventureId);
  const locationTypes = adventure?.location_types && adventure.location_types.length > 0 ? adventure.location_types : DEFAULT_LOCATION_TYPES;
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const { canEdit } = useAdventureRole(adventureId);

  const [name, setName] = useState('');
  const [type, setType] = useState('Other');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dmNotesVisible, setDmNotesVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (location && !loaded.current) {
      loaded.current = true;
      setName(location.name);
      setType(location.type ?? 'Other');
      setImageUrl(location.image_url);
      setDmNotesVisible(location.dm_notes_visible ?? false);
    }
  }, [location]);

  const descEditor = useEditor({
    extensions: [StarterKit],
    content: location?.description ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[200px] focus:outline-none p-3' } },
  });

  const dmNotesEditor = useEditor({
    extensions: [StarterKit],
    content: (location as any)?.dm_notes ?? '',
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none min-h-[150px] focus:outline-none p-3' } },
  });

  useEffect(() => {
    if (descEditor && location?.description && !descEditor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      descEditor.commands.setContent(location.description);
    }
  }, [descEditor, location]);

  useEffect(() => {
    if (dmNotesEditor && (location as any)?.dm_notes && !dmNotesEditor.getHTML().replace(/<[^>]*>/g, '').trim()) {
      dmNotesEditor.commands.setContent((location as any).dm_notes);
    }
  }, [dmNotesEditor, location]);

  const handleSave = useCallback(async () => {
    if (!locationId) return;
    setSaveStatus('saving');
    updateLocation.mutate(
      {
        id: locationId,
        name: name || 'Untitled',
        type,
        image_url: imageUrl,
        description: descEditor?.getHTML() ?? '',
        dm_notes: dmNotesEditor?.getHTML() ?? '',
        dm_notes_visible: dmNotesVisible,
      },
      {
        onSuccess: () => { setSaveStatus('saved'); toast.success('Location saved'); },
        onError: () => { setSaveStatus('idle'); toast.error('Failed to save'); },
      }
    );
  }, [locationId, name, type, imageUrl, descEditor, dmNotesEditor]);

  // Autosave
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded.current || saveStatus === 'saving') return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => handleSave(), 5000);
    return () => clearTimeout(autosaveRef.current);
  }, [name, type, imageUrl, dmNotesVisible]);

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP images');
      return;
    }
    setUploading(true);
    setUploadProgress(30);
    try {
      const url = await uploadLocationImage(file);
      setUploadProgress(100);
      setImageUrl(url);
      setSaveStatus('idle');
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDelete = () => {
    if (!locationId || !adventureId) return;
    deleteLocation.mutate(
      { id: locationId, adventureId },
      { onSuccess: () => { navigate(`/adventure/${adventureId}`); toast.success('Location deleted'); } }
    );
  };

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-foreground">Loading…</div>;
  if (!location) return <div className="min-h-screen bg-background p-8 text-foreground">Location not found</div>;

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
              <BreadcrumbItem><BreadcrumbLink href={`/adventure/${adventureId}`}>Locations</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{name || 'Location'}</BreadcrumbPage></BreadcrumbItem>
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

          {/* Title & Type */}
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSaveStatus('idle'); }}
                  className="font-heading text-xl bg-muted border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <Select value={type} onValueChange={(v) => { setType(v); setSaveStatus('idle'); }}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Image Upload */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Image</h3>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt={name} className="w-full max-h-64 object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => { setImageUrl(null); setSaveStatus('idle'); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-gold/40 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('loc-img-input')?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drop an image here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WEBP • Max 5MB</p>
                <input
                  id="loc-img-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
              </div>
            )}
            {uploading && <Progress value={uploadProgress} className="mt-2 h-1" />}
          </section>

          {/* Description */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-gold mb-3">Description / Details</h3>
            <div className="bg-muted rounded-md border border-border">
              <EditorContent editor={descEditor} />
            </div>
          </section>

          {/* DM Notes */}
          <section className="bg-card border border-border rounded-lg p-4" style={{ backgroundColor: 'hsl(225 20% 15%)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm text-gold">DM Notes (private)</h3>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="loc-dm-notes-visible"
                    checked={dmNotesVisible}
                    onCheckedChange={(checked) => { setDmNotesVisible(!!checked); setSaveStatus('idle'); }}
                  />
                  <Label htmlFor="loc-dm-notes-visible" className="text-xs text-muted-foreground cursor-pointer">
                    Visible to Players
                  </Label>
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-md border border-border">
              <EditorContent editor={dmNotesEditor} />
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 bg-background border-t border-border px-4 py-3 flex items-center gap-3">
        <Button onClick={() => { handleSave(); navigate(`/adventure/${adventureId}`); }} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
          <Save className="w-4 h-4" /> Save & Return
        </Button>
        <div className="flex-1" />
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-1" /> Delete Location
        </Button>
      </footer>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-foreground">Delete this location?</AlertDialogTitle>
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
