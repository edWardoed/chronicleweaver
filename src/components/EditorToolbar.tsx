import type { Editor } from '@tiptap/react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 px-4 py-1.5 bg-[hsl(39,33%,92%)] border-b border-secondary/30">
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
    </div>
  );
}
