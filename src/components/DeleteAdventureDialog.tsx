import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteAdventure } from '@/hooks/useAdventures';
import { toast } from 'sonner';

interface Props {
  adventureId: string | null;
  adventureTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAdventureDialog({ adventureId, adventureTitle, open, onOpenChange }: Props) {
  const deleteAdventure = useDeleteAdventure();

  const handleDelete = async () => {
    if (!adventureId) return;
    try {
      await deleteAdventure.mutateAsync(adventureId);
      toast.success('Adventure deleted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete adventure');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-gold">Delete Adventure</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to delete "<span className="text-foreground font-medium">{adventureTitle}</span>"? This will permanently remove all entries, characters, and locations. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border text-foreground">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete Forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
