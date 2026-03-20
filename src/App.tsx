import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import AdventureDashboard from "./pages/AdventureDashboard.tsx";
import EntryEditor from "./pages/EntryEditor.tsx";
import CharacterSheet from "./pages/CharacterSheet.tsx";
import NPCSheet from "./pages/NPCSheet.tsx";
import LocationEditor from "./pages/LocationEditor.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/adventure/:adventureId" element={<AdventureDashboard />} />
          <Route path="/adventure/:adventureId/entry/:entryId" element={<EntryEditor />} />
          <Route path="/adventure/:adventureId/character/:characterId" element={<CharacterSheet />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
