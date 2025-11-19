import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Upload, X, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface GroupDialogProps {
  group?: any;
  onGroupSaved: () => void;
  mode?: 'create' | 'edit';
}

export function GroupDialog({ group, onGroupSaved, mode = 'create' }: GroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(group?.image_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    location: group?.location || '',
    category: group?.category || 'Professional',
    image_url: group?.image_url || '',
    organizer_name: group?.organizer_name || 'Community Member'
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Handle image upload if a new file is selected
      if (selectedFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedFile);
      }

      const groupData = {
        ...formData,
        organizer_name: mode === 'create' && profile ? profile.display_name : formData.organizer_name,
        user_id: mode === 'create' && user ? user.id : group?.user_id,
        image_url: imageUrl,
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('community_groups')
          .insert([groupData]);

        if (error) throw error;

        toast({
          title: "Grupul a fost creat cu succes!",
          description: "Grupul tău comunitar a fost adăugat.",
        });
      } else {
        const { error } = await supabase
          .from('community_groups')
          .update(groupData)
          .eq('id', group.id);

        if (error) throw error;

        toast({
          title: "Grupul a fost actualizat cu succes!",
          description: "Modificările tale au fost salvate.",
        });
      }

      setOpen(false);
      onGroupSaved();
      
      // Reset form for create mode
      if (mode === 'create') {
        setFormData({
          name: '',
          description: '',
          location: '',
          category: 'Professional',
          image_url: '',
          organizer_name: 'Community Member'
        });
        setSelectedFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
      toast({
        title: "Eroare la salvarea grupului",
        description: "Te rugăm să încerci din nou mai târziu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          !user || !profile ? (
            <Button asChild size="default" className="sm:w-auto">
              <Link to="/auth" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Autentifică-te pentru a crea un grup
              </Link>
            </Button>
          ) : (
            <Button size="default" className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Creează Grup
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-1" />
            Editează
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Creează Grup Nou' : 'Editează Grup'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Completează detaliile pentru a crea un grup comunitar nou.'
              : 'Actualizează detaliile grupului mai jos.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Numele Grupului</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Introdu numele grupului"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrie grupul tău"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="location">Locație</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Locația grupului"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Categorie</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Profesional</SelectItem>
                  <SelectItem value="Family">Familie</SelectItem>
                  <SelectItem value="Students">Studenți</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Sports">Sport</SelectItem>
                  <SelectItem value="Health">Sănătate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Organizator</Label>
              {mode === 'create' && profile ? (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{profile.display_name}</p>
                  {profile.company_name && (
                    <p className="text-xs text-muted-foreground">{profile.company_name}</p>
                  )}
                </div>
              ) : (
                <Input
                  id="organizer_name"
                  value={formData.organizer_name}
                  onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                  placeholder="Numele organizatorului"
                  required
                />
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="image">Imagine Grup (opțional)</Label>
              <div className="space-y-4">
                {/* File Input */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Alege Imagine
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </span>
                  )}
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Previzualizare grup"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={loading || uploadingImage}>
              {loading ? 'Se salvează...' : mode === 'create' ? 'Creează Grupul' : 'Actualizează Grupul'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}