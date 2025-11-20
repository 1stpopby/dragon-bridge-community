import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Contact form validation schema
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Numele trebuie să aibă cel puțin 2 caractere")
    .max(100, "Numele nu poate depăși 100 de caractere"),
  email: z.string()
    .trim()
    .email("Adresa de email invalidă")
    .max(255, "Email-ul nu poate depăși 255 de caractere"),
  subject: z.string()
    .trim()
    .min(3, "Subiectul trebuie să aibă cel puțin 3 caractere")
    .max(200, "Subiectul nu poate depăși 200 de caractere"),
  message: z.string()
    .trim()
    .min(10, "Mesajul trebuie să aibă cel puțin 10 caractere")
    .max(2000, "Mesajul nu poate depăși 2000 de caractere"),
});

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: '',
    officeHours: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['contact_email', 'contact_phone', 'contact_address', 'office_hours']);

        if (error) throw error;

        const settings = data?.reduce((acc, setting) => {
          let value = setting.setting_value;
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              // Keep as string if not JSON
            }
          }
          acc[setting.setting_key] = value;
          return acc;
        }, {} as Record<string, any>);

        setContactInfo({
          email: settings?.contact_email || '',
          phone: settings?.contact_phone || '',
          address: settings?.contact_address || '',
          officeHours: settings?.office_hours || ''
        });
      } catch (error) {
        console.error('Error fetching contact settings:', error);
      }
    };

    fetchContactSettings();
  }, []);

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'press', label: 'Press & Media' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = contactSchema.parse({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      // Save message to database
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: validatedData.name,
          email: validatedData.email,
          subject: validatedData.subject,
          message: validatedData.message,
          status: 'unread'
        });

      if (error) throw error;
      
      toast({
        title: "Mesaj trimis cu succes!",
        description: "Îți vom răspunde în cel mult 24 de ore.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show first validation error
        toast({
          title: "Eroare de validare",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error('Error sending message:', error);
        toast({
          title: "Eroare la trimiterea mesajului",
          description: "Te rugăm să încerci din nou mai târziu.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We'd love to hear from you! Get in touch with the UK Chinese Community team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                Reach out to us through any of these channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {contactInfo.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href={`mailto:${contactInfo.email}`}
                      className="text-primary hover:underline"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a 
                      href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                      className="text-primary hover:underline"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>
              )}

              {contactInfo.officeHours && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Office Hours</p>
                    <div className="text-muted-foreground text-sm whitespace-pre-line">
                      {contactInfo.officeHours}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 20 1234 5678"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide details about your inquiry..."
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">How do I create an account?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Click the "Sign Up" button in the top navigation and follow the registration process.
                </p>

                <h3 className="font-semibold mb-2">Is the platform free to use?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Yes, the UK Chinese Community platform is completely free for all users.
                </p>

                <h3 className="font-semibold mb-2">How do I report inappropriate content?</h3>
                <p className="text-muted-foreground text-sm">
                  Use the report button on any post or contact us directly with details.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Can I post events?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Yes, registered users can create and share community events.
                </p>

                <h3 className="font-semibold mb-2">How do I update my profile?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Go to your profile page and click the "Edit Profile" button.
                </p>

                <h3 className="font-semibold mb-2">Need more help?</h3>
                <p className="text-muted-foreground text-sm">
                  Check our <a href="/help" className="text-primary hover:underline">Help Center</a> for detailed guides.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactForm; 