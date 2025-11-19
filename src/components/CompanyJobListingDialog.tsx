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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CompanyJobListingDialogProps {
  triggerButton: React.ReactNode;
}

export function CompanyJobListingDialog({ triggerButton }: CompanyJobListingDialogProps) {
  const { user, profile } = useAuth();
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
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'service')
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
    
    if (!user || profile?.account_type !== 'company') {
      toast({
        title: "Eroare",
        description: "Doar companiile pot posta anunțuri de angajare.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('services').insert({
        listing_type: 'company',
        name: formData.name,
        specialty: formData.specialty,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        phone: formData.phone,
        email: formData.email,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Succes!",
        description: "Anunțul de angajare a fost adăugat cu succes.",
      });

      setFormData({
        name: "",
        specialty: "",
        category: "",
        description: "",
        location: "",
        phone: "",
        email: "",
      });

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error adding job listing:', error);
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
    if (newOpen && user && profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.company_name || prev.name,
        phone: profile.company_phone || profile.phone || prev.phone,
        email: profile.contact_email || prev.email,
      }));
    }
  };

  if (!user || profile?.account_type !== 'company') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acces restricționat</DialogTitle>
          </DialogHeader>
          <p>Doar companiile pot posta anunțuri de angajare.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Angajăm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nume Companie *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="specialty">Poziție Căutată *</Label>
            <Input
              id="specialty"
              placeholder="ex: Labour, Tiler, Electrician"
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
            <Label htmlFor="description">Descriere Poziție *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrie cerințele și responsabilitățile poziției..."
              rows={4}
              required
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
            <Label htmlFor="phone">Telefon Contact *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Contact *</Label>
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
