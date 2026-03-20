import type { Entry } from '@/lib/types';
import type { CharacterRow } from '@/hooks/useCharacters';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEntryCharacters } from '@/hooks/useEntryLinks';

interface Props {
  entry: Entry;
  characters: CharacterRow[];
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function EntryCard({ entry, characters, onEdit, onDelete, readOnly }: Props) {
  const { data: linkedIds } = useEntryCharacters(entry.id);
  const linked = characters.filter((c) => linkedIds?.includes(c.id));

  const dateDisplay = entry.session_date_start
    ? entry.session_date_end && entry.session_date_end !== entry.session_date_start
      ? `${entry.session_date_start} — ${entry.session_date_end}`
      : entry.session_date_start
    : null;

  return (
    <div className="group flex gap-4 p-4 bg-card rounded-lg border border-border hover:border-gold/40 transition-all">
      <div className="flex-shrink-0 w-12 h-12 rounded-md bg-muted flex items-center justify-center">
        <span className="font-heading text-lg text-gold/60">
          {entry.session_number != null ? `#${entry.session_number}` : '—'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-base text-foreground truncate">{entry.title}</h3>
        {dateDisplay && <p className="text-xs text-muted-foreground mt-0.5">{dateDisplay}</p>}
        {entry.story_content && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {entry.story_content.replace(/<[^>]*>/g, '').slice(0, 120)}
          </p>
        )}
        {linked.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {linked.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  c.type === 'PC' ? 'bg-blue-900/40 text-blue-300' : 'bg-amber-900/40 text-amber-300'
                }`}
              >
                <Avatar className="w-4 h-4">
                  {c.avatar_url ? <AvatarImage src={c.avatar_url} alt={c.name} /> : null}
                  <AvatarFallback className="text-[8px] bg-transparent">{c.name[0]}</AvatarFallback>
                </Avatar>
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {!readOnly && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
