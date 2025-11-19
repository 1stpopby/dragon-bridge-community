import { useState, useRef, useEffect } from "react";
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
import { Plus, Edit2, Upload, X, Lock, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import LocationPicker from "./LocationPicker";

interface MarketplaceDialogProps {
  item?: any;
  onItemSaved: () => void;
  mode?: 'create' | 'edit';
}

export function MarketplaceDialog({ item, onItemSaved, mode = 'create' }: MarketplaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Initialize form data with user profile information when creating new items
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    price: item?.price || '',
    currency: item?.currency || 'GBP',
    category: item?.category || 'Electronics',
    condition: item?.condition || 'good',
    location: item?.location || profile?.location || '',
    seller_name: item?.seller_name || profile?.display_name || '',
    seller_contact: item?.seller_contact || profile?.phone || '',
    image_url: item?.image_url || ''
  });

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'marketplace')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to hardcoded categories
      setCategories([
        { name: "Electronics" },
        { name: "Furniture" },
        { name: "Clothing" },
        { name: "Books" },
        { name: "Kitchen" },
        { name: "Sports" },
        { name: "Tools" },
        { name: "Other" }
      ]);
    }
  };

  // Update form data and preview when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        // Reset form data for edit mode
        setFormData({
          title: item.title || '',
          description: item.description || '',
          price: item.price || '',
          currency: item.currency || 'GBP',
          category: item.category || 'Electronics',
          condition: item.condition || 'good',
          location: item.location || '',
          seller_name: item.seller_name || '',
          seller_contact: item.seller_contact || '',
          image_url: item.image_url || ''
        });
        setPreviewUrl(item.image_url || '');
        setSelectedFile(null);
      } else if (mode === 'create' && profile) {
        // Set profile data for create mode
        setFormData(prev => ({
          ...prev,
          location: prev.location || profile.location || '',
          seller_name: prev.seller_name || profile.display_name || '',
          seller_contact: prev.seller_contact || profile.phone || ''
        }));
      }
    }
  }, [open, mode, item, profile]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
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
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Eroare la încărcarea imaginii",
        description: "Te rugăm să încerci din nou.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tip de fișier invalid",
          description: "Te rugăm să selectezi o imagine.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Fișier prea mare",
          description: "Te rugăm să selectezi o imagine mai mică de 5MB.",
          variant: "destructive",
        });
        return;
      }

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
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication for create mode
    if (mode === 'create' && !user) {
      toast({
        title: "Autentificare necesară",
        description: "Te rugăm să te conectezi pentru a lista produse pe piață.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Handle image upload if a new file is selected
      if (selectedFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedFile);
      }

      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        image_url: imageUrl,
        // CRITICAL FIX: Include user_id when creating items
        ...(mode === 'create' && { user_id: user?.id })
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('marketplace_items')
          .insert([itemData]);

        if (error) throw error;

        toast({
          title: "Produs listat cu succes!",
          description: "Produsul tău a fost adăugat pe piață.",
        });
      } else {
        const { error } = await supabase
          .from('marketplace_items')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: "Produs actualizat cu succes!",
          description: "Modificările tale au fost salvate.",
        });
      }

      setOpen(false);
      onItemSaved();
      
      // Reset form for create mode
      if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          price: '',
          currency: 'GBP',
          category: 'Electronics',
          condition: 'good',
          location: '',
          seller_name: 'Community Member',
          seller_contact: '',
          image_url: ''
        });
        setSelectedFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Eroare la salvarea produsului",
        description: "Te rugăm să încerci din nou.",
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
          !user ? (
            <Button asChild size="default" className="sm:w-auto">
              <Link to="/auth">
                <Lock className="h-4 w-4 mr-2" />
                Conectează-te pentru a Lista Produs
              </Link>
            </Button>
          ) : (
            <Button size="default" className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Listează Produs
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-1" />
            Editează
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Listează Produs Nou' : 'Editează Produs'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Completează detaliile pentru a lista produsul tău pe piață.'
              : 'Actualizează detaliile produsului mai jos.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Titlu Produs</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Introdu titlul produsului"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrie produsul tău"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="price">Preț</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Monedă</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Categorie</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.name || category} value={category.name || category}>
                      {category.name || category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condiție</Label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează condiția" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nou</SelectItem>
                  <SelectItem value="like_new">Ca Nou</SelectItem>
                  <SelectItem value="good">Bună</SelectItem>
                  <SelectItem value="fair">Acceptabilă</SelectItem>
                  <SelectItem value="poor">Slabă</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="location">Locație</Label>
              <LocationPicker
                onLocationSelect={(location) => handleInputChange('location', location.address)}
                initialLocation={formData.location}
                placeholder="Introdu locația produsului sau apasă pe hartă"
              />
            </div>
            <div>
              <Label htmlFor="seller_name">Numele Tău</Label>
              <Input
                id="seller_name"
                value={formData.seller_name}
                onChange={(e) => handleInputChange('seller_name', e.target.value)}
                placeholder="Numele tău"
                required
              />
            </div>
            <div>
              <Label htmlFor="seller_contact">Telefon (Opțional)</Label>
              <Input
                id="seller_contact"
                value={formData.seller_contact}
                onChange={(e) => handleInputChange('seller_contact', e.target.value)}
                placeholder="+40 700 000 000"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="image">Imagine Produs</Label>
              <div className="space-y-4">
                {previewUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={previewUrl}
                      alt="Previzualizare produs"
                      className="w-full h-full object-cover"
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
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {uploadingImage ? "Se încarcă imaginea..." : previewUrl ? "Schimbă Imaginea" : "Încarcă Imagine"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selectat: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={loading || uploadingImage}>
              {loading ? 'Se salvează...' : mode === 'create' ? 'Listează Produs' : 'Actualizează Produs'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
