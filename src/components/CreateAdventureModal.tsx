import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAdventure, uploadCoverImage } from '@/hooks/useAdventures';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GAME_SYSTEMS = ['D&D 5E'] as const;

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  game_system: z.string().default('D&D 5E'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAdventureModal({ open, onOpenChange }: Props) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const createAdventure = useCreateAdventure();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP are allowed');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: FormData) => {
    try {
      let cover_image_url: string | undefined;
      if (coverFile) {
        cover_image_url = await uploadCoverImage(coverFile);
      }
      await createAdventure.mutateAsync({
        title: data.title,
        description: data.description,
        cover_image_url,
      });
      toast.success('Adventure created!');
      reset();
      setCoverFile(null);
      setCoverPreview(null);
      onOpenChange(false);
    } catch {
      toast.error('Failed to create adventure');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-gold">Create New Adventure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-foreground">Title *</Label>
            <Input {...register('title')} className="bg-muted border-border text-foreground" placeholder="The Lost Mine of Phandelver" />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label className="text-foreground">Game System *</Label>
            <Select defaultValue="D&D 5E" onValueChange={(val) => setValue('game_system', val)}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Select a game system" />
              </SelectTrigger>
              <SelectContent>
                {GAME_SYSTEMS.map((gs) => (
                  <SelectItem key={gs} value={gs}>{gs}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground">Description</Label>
            <Textarea {...register('description')} className="bg-muted border-border text-foreground resize-none" rows={3} placeholder="A tale of danger and discovery..." />
          </div>
          <div>
            <Label className="text-foreground">Cover Image</Label>
            <div className="mt-1">
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-32 object-cover rounded-md" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-gold transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">JPG, PNG, WEBP — max 5MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
          <Button type="submit" disabled={createAdventure.isPending} className="w-full bg-burgundy hover:bg-burgundy-light text-foreground font-heading">
            {createAdventure.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Begin Chronicle'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
