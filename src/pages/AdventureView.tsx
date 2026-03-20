import { useParams, useNavigate } from 'react-router-dom';
import { useAdventure } from '@/hooks/useAdventure';
import { useEntries } from '@/hooks/useEntries';
import { useCharacters } from '@/hooks/useCharacters';
import { useLocations } from '@/hooks/useLocations';
import { CharacterList } from '@/components/CharacterList';
import { LocationList } from '@/components/LocationList';
import { EntryCard } from '@/components/EntryCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Eye } from 'lucide-react';

export default function AdventureView() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();
  const { data: adventure, isLoading } = useAdventure(adventureId);
  const { data: entries, isLoading: entriesLoading } = useEntries(adventureId!);
  const { data: characters } = useCharacters(adventureId!);

  if (isLoading) return <div className="min-h-screen bg-background p-8"><Skeleton className="h-12 w-64" /></div>;
  if (!adventure) return <div className="min-h-screen bg-background p-8 text-foreground">Adventure not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Read-only banner */}
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-center gap-2">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Viewing in read-only mode</span>
      </div>

      <header className="border-b border-border px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-heading text-xl text-gold">{adventure.title}</span>
      </header>

      <Tabs defaultValue="entries" className="flex-1 flex flex-col">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-auto gap-0">
            <TabsTrigger value="entries" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Entries</TabsTrigger>
            <TabsTrigger value="characters" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Characters</TabsTrigger>
            <TabsTrigger value="locations" className="font-heading data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">Locations</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="entries" className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-lg text-foreground mb-6">Journal Entries</h2>
            {entriesLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : entries && entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    characters={characters ?? []}
                    readOnly
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No entries yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="characters" className="flex-1 p-4 md:p-6">
          <CharacterList adventureId={adventureId!} readOnly />
        </TabsContent>

        <TabsContent value="locations" className="flex-1 p-4 md:p-6">
          <LocationList adventureId={adventureId!} readOnly />
        </TabsContent>
      </Tabs>
    </div>
  );
}
