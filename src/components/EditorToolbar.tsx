import { useState, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, ImageIcon, Upload, Link, X, AlignLeft, AlignCenter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  editor: Editor | null;
}

const items = [
  { icon: Bold, action: (e: Editor) => e.chain().focus().toggleBold().run(), active: (e: Editor) => e.isActive('bold'), label: 'Bold' },
  { icon: Italic, action: (e: Editor) => e.chain().focus().toggleItalic().run(), active: (e: Editor) => e.isActive('italic'), label: 'Italic' },
  { icon: Heading1, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run(), active: (e: Editor) => e.isActive('heading', { level: 1 }), label: 'Heading 1' },
  { icon: Heading2, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e: Editor) => e.isActive('heading', { level: 2 }), label: 'Heading 2' },
  { icon: Heading3, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e: Editor) => e.isActive('heading', { level: 3 }), label: 'Heading 3' },
  { icon: List, action: (e: Editor) => e.chain().focus().toggleBulletList().run(), active: (e: Editor) => e.isActive('bulletList'), label: 'Bullet List' },
  { icon: ListOrdered, action: (e: Editor) => e.chain().focus().toggleOrderedList().run(), active: (e: Editor) => e.isActive('orderedList'), label: 'Ordered List' },
  { icon: Quote, action: (e: Editor) => e.chain().focus().toggleBlockquote().run(), active: (e: Editor) => e.isActive('blockquote'), label: 'Blockquote' },
  { icon: Minus, action: (e: Editor) => e.chain().focus().setHorizontalRule().run(), active: () => false, label: 'Horizontal Rule' },
];

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function EditorToolbar({ editor }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlValue, setUrlValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  if (!editor) return null;

  const insertImage = (src: string) => {
    editor.chain().focus().setImage({ src }).run();
    setPopoverOpen(false);
    setUrlValue('');
  };

  const handleUpload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `entry-images/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('adventure-images').upload(path, file);
    if (error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('adventure-images').getPublicUrl(path);
    insertImage(urlData.publicUrl);
    toast.success('Image inserted');
    setUploading(false);
  };

  const handleUrlInsert = () => {
    if (!urlValue.trim()) return;
    insertImage(urlValue.trim());
  };

  // Check if selected node is an image for alignment controls
  const isImageSelected = editor.isActive('image');

  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 px-4 py-1.5 bg-[hsl(39,33%,92%)] border-b border-secondary/30 relative">
      {items.map(({ icon: Icon, action, active, label }) => (
        <button
          key={label}
          type="button"
          onClick={() => action(editor)}
          title={label}
          className={cn(
            'p-1.5 rounded transition-colors',
            active(editor)
              ? 'bg-primary/20 text-primary'
              : 'text-[hsl(230,25%,14%)] hover:bg-secondary/20'
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-5 bg-secondary/30 mx-1" />

      {/* Image button */}
      <button
        type="button"
        onClick={() => setPopoverOpen(!popoverOpen)}
        title="Insert Image"
        className={cn(
          'p-1.5 rounded transition-colors',
          popoverOpen
            ? 'bg-primary/20 text-primary'
            : 'text-[hsl(230,25%,14%)] hover:bg-secondary/20'
        )}
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* Image alignment controls (visible when image is selected) */}
      {isImageSelected && (
        <>
          <div className="w-px h-5 bg-secondary/30 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { style: 'display:block;margin-left:0;margin-right:auto;' }).run()}
            title="Align Left"
            className="p-1.5 rounded transition-colors text-[hsl(230,25%,14%)] hover:bg-secondary/20"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { style: 'display:block;margin-left:auto;margin-right:auto;' }).run()}
            title="Center"
            className="p-1.5 rounded transition-colors text-[hsl(230,25%,14%)] hover:bg-secondary/20"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Image popover */}
      {popoverOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-card border border-border rounded-lg shadow-xl z-50 p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-heading text-gold">Insert Image</h4>
            <button onClick={() => setPopoverOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setTab('upload')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                tab === 'upload' ? 'bg-burgundy text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Upload className="w-3 h-3" /> Upload
            </button>
            <button
              onClick={() => setTab('url')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                tab === 'url' ? 'bg-burgundy text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Link className="w-3 h-3" /> From URL
            </button>
          </div>

          {tab === 'upload' && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-6 border-2 border-dashed border-border rounded-lg text-center text-sm text-muted-foreground hover:border-gold hover:text-foreground transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </span>
                ) : (
                  <>Click to choose an image<br /><span className="text-xs">JPG, PNG, WEBP · Max 5MB</span></>
                )}
              </button>
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-2">
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full h-8 px-2 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                onKeyDown={(e) => { if (e.key === 'Enter') handleUrlInsert(); }}
              />
              <button
                onClick={handleUrlInsert}
                disabled={!urlValue.trim()}
                className="w-full h-8 text-xs font-heading bg-burgundy hover:bg-burgundy-light text-foreground rounded transition-colors disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
