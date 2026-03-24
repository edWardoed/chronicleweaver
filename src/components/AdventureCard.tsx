import type { Adventure } from '@/lib/types';
import type { AdventureRole } from '@/hooks/useAdventureRole';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  adventure: Adventure;
  role?: AdventureRole;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (adventure: Adventure) => void;
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  dm: { label: 'DM', className: 'bg-gold text-background' },
  scribe: { label: 'Scribe', className: 'bg-burgundy text-foreground' },
  viewer: { label: 'Viewer', className: '' },
};

export function AdventureCard({ adventure, role, onView, onEdit, onDelete }: Props) {
  const canEdit = role === 'dm' || !role; // admin has no role entry, defaults to full
  const canEditPartial = role === 'scribe';
  const showEditButton = canEdit || canEditPartial;

  return (
    <div className="group flex gap-4 p-4 bg-card rounded-lg border border-border hover:border-gold/40 transition-all animate-fade-in">
      {adventure.cover_image_url ? (
        <img
          src={adventure.cover_image_url}
          alt={adventure.title}
          className="w-20 h-20 rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <span className="font-heading text-2xl text-gold/40">{adventure.title[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-lg text-gold truncate">{adventure.title}</h3>
          {role && ROLE_LABELS[role] && (
            <Badge variant="secondary" className={ROLE_LABELS[role].className + ' text-xs'}>
              {ROLE_LABELS[role].label}
            </Badge>
          )}
        </div>
        {adventure.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{adventure.description}</p>
        )}
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!showEditButton && (
          <Button variant="ghost" size="icon" onClick={() => onView(adventure.id)} title="View">
            <Eye className="w-4 h-4 text-foreground" />
          </Button>
        )}
        {showEditButton && (
          <Button variant="ghost" size="icon" onClick={() => onEdit(adventure.id)} title="Edit">
            <Pencil className="w-4 h-4 text-foreground" />
          </Button>
        )}
        {canEdit && (
          <Button variant="ghost" size="icon" onClick={() => onDelete(adventure)} title="Delete">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
