import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SelfEmployedListingDialogProps {
  triggerButton: React.ReactNode;
}

export function SelfEmployedListingDialog({ triggerButton }: SelfEmployedListingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    category: "",
    description: "",
    location: "",
    phone: "",
    email: "",
    has_cscs: false,
    utr_number: "",
    nino: "",
    right_to_work: false,
    years_experience: 0,
    valid_from: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'service_self_employed')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat pentru a adăuga un anunț.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('services').insert({
        listing_type: 'self_employed',
        name: formData.name,
        specialty: formData.specialty,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        phone: formData.phone,
        email: formData.email,
        has_cscs: formData.has_cscs,
        utr_number: formData.utr_number,
        nino: formData.nino,
        right_to_work: formData.right_to_work,
        years_experience: formData.years_experience,
        valid_from: formData.valid_from || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Succes!",
        description: "Anunțul tău a fost adăugat cu succes.",
      });

      setFormData({
        name: "",
        specialty: "",
        category: "",
        description: "",
        location: "",
        phone: "",
        email: "",
        has_cscs: false,
        utr_number: "",
        nino: "",
        right_to_work: false,
        years_experience: 0,
        valid_from: "",
      });

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error adding listing:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la adăugarea anunțului.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone, contact_email')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.display_name || prev.name,
          phone: profile.phone || prev.phone,
          email: profile.contact_email || prev.email,
        }));
      }
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Autentificare necesară</DialogTitle>
          </DialogHeader>
          <p>Trebuie să fii autentificat pentru a adăuga un anunț.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă Anunț - Caut Muncă</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nume Complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="specialty">Specializare *</Label>
            <Input
              id="specialty"
              placeholder="ex: Tiler, Labour, Electrician"
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categorie *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selectează categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="years_experience">Ani de experiență *</Label>
            <Input
              id="years_experience"
              type="number"
              min="0"
              value={formData.years_experience}
              onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <Label htmlFor="valid_from">Valabil de la</Label>
            <Input
              id="valid_from"
              type="date"
              value={formData.valid_from}
              onChange={(e) => handleInputChange('valid_from', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_cscs"
                checked={formData.has_cscs}
                onCheckedChange={(checked) => handleInputChange('has_cscs', checked)}
              />
              <Label htmlFor="has_cscs" className="cursor-pointer">
                Am card CSCS
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="right_to_work"
                checked={formData.right_to_work}
                onCheckedChange={(checked) => handleInputChange('right_to_work', checked)}
              />
              <Label htmlFor="right_to_work" className="cursor-pointer">
                Am drept de muncă în UK
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="utr_number">UTR Number</Label>
            <Input
              id="utr_number"
              value={formData.utr_number}
              onChange={(e) => handleInputChange('utr_number', e.target.value)}
              placeholder="Opțional"
            />
          </div>

          <div>
            <Label htmlFor="nino">National Insurance Number</Label>
            <Input
              id="nino"
              value={formData.nino}
              onChange={(e) => handleInputChange('nino', e.target.value)}
              placeholder="Opțional"
            />
          </div>

          <div>
            <Label htmlFor="description">Descriere</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrie experiența și abilitățile tale..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="location">Locație *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="ex: Londra, Manchester"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publică Anunț
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
