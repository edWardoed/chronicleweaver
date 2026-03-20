import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCharacter } from "@/hooks/useCharacters";
import Index from "./pages/Index.tsx";
import AdventureDashboard from "./pages/AdventureDashboard.tsx";
import AdventureView from "./pages/AdventureView.tsx";
import EntryEditor from "./pages/EntryEditor.tsx";
import CharacterSheet from "./pages/CharacterSheet.tsx";
import NPCSheet from "./pages/NPCSheet.tsx";
import LocationEditor from "./pages/LocationEditor.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function CharacterSheetRouter() {
  const { characterId } = useParams<{ characterId: string }>();
  const { data: character, isLoading } = useCharacter(characterId);
  if (isLoading) return <div className="min-h-screen bg-background p-8 text-foreground">Loading…</div>;
  if (!character) return <div className="min-h-screen bg-background p-8 text-foreground">Character not found</div>;
  return character.type === 'NPC' ? <NPCSheet /> : <CharacterSheet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/adventure/:adventureId" element={<AdventureDashboard />} />
          <Route path="/adventure/:adventureId/view" element={<AdventureView />} />
          <Route path="/adventure/:adventureId/entry/:entryId" element={<EntryEditor />} />
          <Route path="/adventure/:adventureId/character/:characterId" element={<CharacterSheetRouter />} />
          <Route path="/adventure/:adventureId/location/:locationId" element={<LocationEditor />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
