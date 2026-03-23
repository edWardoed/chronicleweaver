import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useCharacter } from "@/hooks/useCharacters";
import Index from "./pages/Index.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import AdminUsersPage from "./pages/AdminUsersPage.tsx";
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/adventure/:adventureId" element={<ProtectedRoute><AdventureDashboard /></ProtectedRoute>} />
            <Route path="/adventure/:adventureId/view" element={<ProtectedRoute><AdventureView /></ProtectedRoute>} />
            <Route path="/adventure/:adventureId/entry/:entryId" element={<ProtectedRoute><EntryEditor /></ProtectedRoute>} />
            <Route path="/adventure/:adventureId/character/:characterId" element={<ProtectedRoute><CharacterSheetRouter /></ProtectedRoute>} />
            <Route path="/adventure/:adventureId/location/:locationId" element={<ProtectedRoute><LocationEditor /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
