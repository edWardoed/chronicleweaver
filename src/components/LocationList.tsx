import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocations, useCreateLocation, useDeleteLocation, type LocationRow } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_LOCATION_TYPES = ['City', 'Town', 'Village', 'Dungeon', 'Ruins', 'Wilderness', 'Building', 'Landmark', 'Region', 'Other'];

interface Props {
  adventureId: string;
  readOnly?: boolean;
  locationTypes?: string[];
}

export function LocationList({ adventureId, readOnly, locationTypes }: Props) {
  const types = locationTypes && locationTypes.length > 0 ? locationTypes : DEFAULT_LOCATION_TYPES;
  const navigate = useNavigate();
  const { data: locations, isLoading } = useLocations(adventureId);
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Other');
  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createLocation.mutate(
      { adventure_id: adventureId, name: newName.trim(), type: newType },
      {
        onSuccess: (data) => {
          setAddOpen(false);
          setNewName('');
          toast.success('Location created');
          navigate(`/adventure/${adventureId}/location/${data.id}`);
        },
        onError: () => toast.error('Failed to create location'),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteLocation.mutate(
      { id: deleteTarget.id, adventureId },
      {
        onSuccess: () => { setDeleteTarget(null); toast.success('Location deleted'); },
        onError: () => toast.error('Failed to delete'),
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-lg text-foreground">Locations</h2>
        {!readOnly && (
          <Button onClick={() => setAddOpen(true)} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading gap-2">
            <Plus className="w-4 h-4" /> Add Location
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : locations && locations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={readOnly ? undefined : () => navigate(`/adventure/${adventureId}/location/${loc.id}`)}
              onDelete={readOnly ? undefined : () => setDeleteTarget(loc)}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">No locations yet.</p>
          {!readOnly && (
            <Button onClick={() => setAddOpen(true)} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-heading">
              Mark your first location
            </Button>
          )}
        </div>
      )}

      {/* Add Location Modal */}
      {!readOnly && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-gold">New Location</DialogTitle>
              <DialogDescription>Create a new location for this adventure.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Location name…"
                  className="bg-muted border-border mt-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="bg-muted border-border mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()} className="bg-burgundy hover:bg-burgundy-light text-foreground font-heading">
                Create & Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-foreground">Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The location will be permanently removed from all entries.</AlertDialogDescription>
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

function LocationCard({ location, onEdit, onDelete, readOnly }: { location: LocationRow; onEdit?: () => void; onDelete?: () => void; readOnly?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden group hover:border-gold/30 transition-colors">
      {location.image_url ? (
        <img src={location.image_url} alt={location.name} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-muted flex items-center justify-center">
          <MapPin className="w-10 h-10 text-muted-foreground/30" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-heading text-foreground truncate">{location.name}</h3>
            {location.type && (
              <Badge variant="outline" className="border-gold/40 text-gold text-xs mt-1">{location.type}</Badge>
            )}
          </div>
          {!readOnly && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
