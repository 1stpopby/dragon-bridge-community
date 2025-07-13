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
import { Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ServiceContactDialogProps {
  service: any;
  triggerButton: React.ReactNode;
}

export function ServiceContactDialog({ service, triggerButton }: ServiceContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('service_inquiries')
        .insert({
          service_id: service.id,
          inquirer_name: formData.name,
          inquirer_email: formData.email,
          inquirer_phone: formData.phone,
          message: formData.message,
          inquiry_type: 'contact',
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Message sent successfully!",
        description: "The service provider will get back to you soon.",
      });

      setOpen(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later.",
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact {service.name}</DialogTitle>
          <DialogDescription>
            Send a message to {service.name} or contact them directly using the information below.
          </DialogDescription>
        </DialogHeader>

        {/* Direct contact info */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h4 className="font-medium">Direct Contact</h4>
          {service.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              <a href={`tel:${service.phone}`} className="hover:underline">
                {service.phone}
              </a>
            </div>
          )}
          {service.email && (
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <a href={`mailto:${service.email}`} className="hover:underline">
                {service.email}
              </a>
            </div>
          )}
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your name"
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
                placeholder="Your email"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Your phone number"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Describe your inquiry or what service you need..."
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}