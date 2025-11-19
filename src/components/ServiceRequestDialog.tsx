import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

interface ServiceRequestDialogProps {
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ServiceRequestDialog({ triggerButton, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ServiceRequestDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    category: '',
    service_type: '',
    description: '',
    budget: '',
    urgency: 'medium'
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestData = {
        service_id: null, // No specific service, this is a general request
        inquirer_name: formData.name,
        inquirer_email: formData.email,
        inquirer_phone: formData.phone,
        message: `Service Request:
Location: ${formData.location}
Category: ${formData.category}
Service Type: ${formData.service_type}
Budget: ${formData.budget}
Urgency: ${formData.urgency}

Description:
${formData.description}`,
        inquiry_type: 'request_service',
        user_id: user?.id
      };
      
      const { data, error } = await supabase
        .from('service_inquiries')
        .insert(requestData)
        .select();
      
      if (error) throw error;

      toast({
        title: "Cererea de serviciu a fost trimisă!",
        description: "Te vom ajuta să te conectezi cu furnizori de servicii potriviți.",
      });

      setOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        category: '',
        service_type: '',
        description: '',
        budget: '',
        urgency: 'medium'
      });
      
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Eroare la trimiterea cererii",
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
    if (newOpen && user && profile && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: profile.display_name || '',
        email: profile.contact_email || user.email || ''
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
              Te rugăm să te autentifici pentru a solicita un serviciu din comunitatea noastră.
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
      {triggerButton && (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicită un Serviciu</DialogTitle>
          <DialogDescription>
            Spune-ne de ce serviciu ai nevoie și te vom ajuta să te conectezi cu furnizori potriviți.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nume</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Numele tău"
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
                placeholder="Email-ul tău"
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
                placeholder="Numărul tău de telefon"
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categorie Serviciu</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Servicii Juridice</SelectItem>
                  <SelectItem value="medical">Sănătate</SelectItem>
                  <SelectItem value="financial">Financiar</SelectItem>
                  <SelectItem value="education">Educație</SelectItem>
                  <SelectItem value="other">Altele</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Urgență</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează urgența" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Scăzută - În o lună</SelectItem>
                  <SelectItem value="medium">Mediu - În 2 săptămâni</SelectItem>
                  <SelectItem value="high">Înaltă - În 1 săptămână</SelectItem>
                  <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="service_type">Serviciul Specific Necesar</Label>
            <Input
              id="service_type"
              value={formData.service_type}
              onChange={(e) => handleInputChange('service_type', e.target.value)}
              placeholder="ex: Avocat imigrație, Medic de familie, Consultant fiscal"
              required
            />
          </div>

          <div>
            <Label htmlFor="budget">Interval Buget (Opțional)</Label>
            <Input
              id="budget"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="ex: £500-1000, Contactați pentru ofertă"
            />
          </div>

          <div>
            <Label htmlFor="description">Descriere Detaliată</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrie de ce ai nevoie, cerințe specifice, termen, etc."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Se trimite..." : "Trimite Cererea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}