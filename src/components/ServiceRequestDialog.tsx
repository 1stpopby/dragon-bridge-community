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
      const { error } = await supabase
        .from('service_inquiries')
        .insert({
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
        });

      if (error) throw error;

      toast({
        title: "Service request submitted!",
        description: "We'll help connect you with suitable service providers.",
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
        title: "Error submitting request",
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

  if (!user || !profile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in to request a service from our community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Button asChild>
              <Link to="/auth" className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Sign In
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
          <DialogTitle>Request a Service</DialogTitle>
          <DialogDescription>
            Tell us what service you need and we'll help connect you with suitable providers.
          </DialogDescription>
        </DialogHeader>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Your phone number"
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City or area"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Service Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Legal Services</SelectItem>
                  <SelectItem value="medical">Healthcare</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Within a month</SelectItem>
                  <SelectItem value="medium">Medium - Within 2 weeks</SelectItem>
                  <SelectItem value="high">High - Within a week</SelectItem>
                  <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="service_type">Specific Service Needed</Label>
            <Input
              id="service_type"
              value={formData.service_type}
              onChange={(e) => handleInputChange('service_type', e.target.value)}
              placeholder="e.g., Immigration lawyer, Family doctor, Tax advisor"
              required
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget Range (Optional)</Label>
            <Input
              id="budget"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="e.g., £500-1000, Contact for quote"
            />
          </div>

          <div>
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what you need, any specific requirements, timeline, etc."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}