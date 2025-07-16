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
    languages: [] as string[]
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const availableLanguages = ['English', 'Mandarin', 'Cantonese', 'Wu', 'Min', 'Hakka'];

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
          languages: formData.languages,
          user_id: user?.id,
          verified: false, // Will need manual verification
          featured: false
        });

      if (error) throw error;

      toast({
        title: "Business listing submitted!",
        description: "Your business will be reviewed and published within 24-48 hours.",
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
        languages: []
      });
    } catch (error) {
      console.error('Error submitting business listing:', error);
      toast({
        title: "Error submitting listing",
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

  const handleLanguageToggle = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages: checked 
        ? [...prev.languages, language]
        : prev.languages.filter(lang => lang !== language)
    }));
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
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in to list your business in our directory.
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
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List Your Business</DialogTitle>
          <DialogDescription>
            Add your business to our directory to connect with the Chinese community in the UK.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your business name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                placeholder="e.g., Immigration Law, General Practice"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your services and what makes your business special"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Name of main contact"
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
                placeholder="Business phone number"
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
                placeholder="Business email"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://your-website.com"
            />
          </div>

          <div>
            <Label>Languages Spoken</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {availableLanguages.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={language}
                    checked={formData.languages.includes(language)}
                    onCheckedChange={(checked) => handleLanguageToggle(language, !!checked)}
                  />
                  <Label htmlFor={language} className="text-sm">{language}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Your listing will be reviewed for accuracy and compliance before being published. 
              This typically takes 24-48 hours.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}