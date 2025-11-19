import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

interface ListBusinessDialogProps {
  triggerButton: React.ReactNode;
}

export function ListBusinessDialog({ triggerButton }: ListBusinessDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    category: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    contact_person: '',
    
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'services')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to hardcoded categories
      setCategories([
        { name: "Legal", value: "legal" },
        { name: "Medical", value: "medical" },
        { name: "Financial", value: "financial" },
        { name: "Education", value: "education" }
      ]);
    }
  };

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('services')
        .insert({
          name: formData.name,
          specialty: formData.specialty,
          category: formData.category,
          description: formData.description,
          location: formData.location,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          contact_person: formData.contact_person,
          
          user_id: user?.id,
          verified: false, // Will need manual verification
          featured: false
        });

      if (error) throw error;

      toast({
        title: "Listarea a fost trimisă!",
        description: "Afacerea ta va fi revizuită și publicată în 24-48 de ore.",
      });

      setOpen(false);
      setFormData({
        name: '',
        specialty: '',
        category: '',
        description: '',
        location: '',
        phone: '',
        email: '',
        website: '',
        contact_person: '',
        
      });
    } catch (error) {
      console.error('Error submitting business listing:', error);
      toast({
        title: "Eroare la trimiterea listării",
        description: "Te rugăm să încerci din nou mai târziu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  // Pre-fill form if user is logged in
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && user && profile && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: profile.contact_email || user.email || '',
        contact_person: profile.display_name || ''
      }));
    }
    setOpen(newOpen);
  };

  if (!user || !profile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Autentificare Necesară</DialogTitle>
            <DialogDescription>
              Te rugăm să te autentifici pentru a-ți lista afacerea în directorul nostru.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Button asChild>
              <Link to="/auth" className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Autentifică-te
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă Afacerea Ta</DialogTitle>
          <DialogDescription>
            Adaugă afacerea ta în directorul nostru pentru a te conecta cu comunitatea română.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Numele Afacerii</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Numele afacerii tale"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categorie</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id || category.value} value={category.name.toLowerCase()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="specialty">Specialitate</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                placeholder="ex: Drept Imigrație, Practică Generală"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descriere</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrie serviciile tale și ce face afacerea ta specială"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Locație</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Oraș sau zonă"
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Persoană de Contact</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Numele persoanei de contact"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Număr de telefon al afacerii"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email afacere"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website (Opțional)</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://website-ul-tau.ro"
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Notă:</strong> Listarea ta va fi revizuită pentru acuratețe și conformitate înainte de a fi publicată. 
              Acest proces durează de obicei 24-48 de ore.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Se trimite..." : "Trimite Listarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}