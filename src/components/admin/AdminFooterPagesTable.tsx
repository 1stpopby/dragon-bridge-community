import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, Calendar, User, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FooterPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminFooterPagesTableProps {
  onDataChange: () => void;
}

export function AdminFooterPagesTable({ onDataChange }: AdminFooterPagesTableProps) {
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<FooterPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    meta_description: '',
    is_published: true,
    // Contact page specific fields
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    office_hours: {
      monday_friday: '9:00 AM - 6:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed'
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('footer_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching footer pages:', error);
      toast({
        title: "Error loading pages",
        description: "Failed to load footer pages from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate content based on page type
      let content = formData.content;
      
      // Special handling for contact page
      if (formData.slug === 'contact') {
        content = `<div class="max-w-4xl mx-auto">
          <h1 class="text-3xl font-bold mb-6">Contact Us</h1>
          <p class="text-lg mb-8">Get in touch with the UK Chinese Community team. We're here to help!</p>
          
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-xl font-semibold mb-4">Get in Touch</h2>
              <div class="space-y-3">
                <p><strong>Email:</strong> ${formData.contact_email}</p>
                <p><strong>Phone:</strong> ${formData.contact_phone}</p>
                <p><strong>Address:</strong> ${formData.contact_address}</p>
              </div>
            </div>
            
            <div>
              <h2 class="text-xl font-semibold mb-4">Office Hours</h2>
              <div class="space-y-2">
                <p><strong>Monday - Friday:</strong> ${formData.office_hours.monday_friday}</p>
                <p><strong>Saturday:</strong> ${formData.office_hours.saturday}</p>
                <p><strong>Sunday:</strong> ${formData.office_hours.sunday}</p>
              </div>
            </div>
          </div>
        </div>`;
      }
      
      if (editingPage) {
        // Update existing page
        const { error } = await supabase
          .from('footer_pages')
          .update({
            slug: formData.slug,
            title: formData.title,
            content: content,
            meta_description: formData.meta_description || null,
            is_published: formData.is_published,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPage.id);

        if (error) {
          throw error;
        }
        
        toast({
          title: "Page updated",
          description: "Footer page has been updated successfully.",
        });
      } else {
        // Create new page
        const { error } = await supabase
          .from('footer_pages')
          .insert([{
            slug: formData.slug,
            title: formData.title,
            content: content,
            meta_description: formData.meta_description || null,
            is_published: formData.is_published
          }]);

        if (error) {
          throw error;
        }
        
        toast({
          title: "Page created",
          description: "New footer page has been created successfully.",
        });
      }

      fetchPages();
      onDataChange();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast({
        title: "Error saving page",
        description: error.message || "Failed to save footer page.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (page: FooterPage) => {
    setEditingPage(page);
    
    // Parse contact info from content if it's the contact page
    let contactInfo = {
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      office_hours: {
        monday_friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      }
    };
    
    if (page.slug === 'contact') {
      // Extract contact info from HTML content
      const emailMatch = page.content.match(/<strong>Email:<\/strong>\s*([^<]+)/);
      const phoneMatch = page.content.match(/<strong>Phone:<\/strong>\s*([^<]+)/);
      const addressMatch = page.content.match(/<strong>Address:<\/strong>\s*([^<]+)/);
      const mondayFridayMatch = page.content.match(/<strong>Monday - Friday:<\/strong>\s*([^<]+)/);
      const saturdayMatch = page.content.match(/<strong>Saturday:<\/strong>\s*([^<]+)/);
      const sundayMatch = page.content.match(/<strong>Sunday:<\/strong>\s*([^<]+)/);
      
      if (emailMatch) contactInfo.contact_email = emailMatch[1].trim();
      if (phoneMatch) contactInfo.contact_phone = phoneMatch[1].trim();
      if (addressMatch) contactInfo.contact_address = addressMatch[1].trim();
      if (mondayFridayMatch) contactInfo.office_hours.monday_friday = mondayFridayMatch[1].trim();
      if (saturdayMatch) contactInfo.office_hours.saturday = saturdayMatch[1].trim();
      if (sundayMatch) contactInfo.office_hours.sunday = sundayMatch[1].trim();
    }
    
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      meta_description: page.meta_description || '',
      is_published: page.is_published,
      ...contactInfo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('footer_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Page deleted",
        description: "Footer page has been deleted successfully.",
      });

      fetchPages();
      onDataChange();
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error deleting page",
        description: error.message || "Failed to delete footer page.",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('footer_pages')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentStatus ? "Page unpublished" : "Page published",
        description: `Footer page has been ${currentStatus ? 'unpublished' : 'published'} successfully.`,
      });

      fetchPages();
      onDataChange();
    } catch (error: any) {
      console.error('Error updating page status:', error);
      toast({
        title: "Error updating page",
        description: error.message || "Failed to update page status.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      meta_description: '',
      is_published: true,
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      office_hours: {
        monday_friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      }
    });
    setEditingPage(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Footer Pages Management</h2>
          <p className="text-muted-foreground">
            Manage static pages like Contact, Privacy Policy, Terms of Service, and Help Center
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Edit Footer Page' : 'Create New Footer Page'}
              </DialogTitle>
              <DialogDescription>
                {editingPage ? 'Update the footer page details below.' : 'Create a new static page for the footer.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL path)</Label>
                  <Input
                    id="slug"
                    placeholder="contact, privacy, terms, etc."
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    placeholder="Contact Us, Privacy Policy, etc."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                <Input
                  id="meta_description"
                  placeholder="Brief description for search engines"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                />
              </div>
              
              {/* Contact page specific fields */}
              {formData.slug === 'contact' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        placeholder="info@ukchinesecommunity.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        placeholder="+44 20 1234 5678"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_address">Contact Address</Label>
                    <Input
                      id="contact_address"
                      placeholder="123 Community Street, London, UK"
                      value={formData.contact_address}
                      onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Office Hours</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monday_friday">Monday - Friday</Label>
                        <Input
                          id="monday_friday"
                          placeholder="9:00 AM - 6:00 PM"
                          value={formData.office_hours.monday_friday}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            office_hours: { ...formData.office_hours, monday_friday: e.target.value }
                          })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="saturday">Saturday</Label>
                        <Input
                          id="saturday"
                          placeholder="10:00 AM - 4:00 PM"
                          value={formData.office_hours.saturday}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            office_hours: { ...formData.office_hours, saturday: e.target.value }
                          })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sunday">Sunday</Label>
                        <Input
                          id="sunday"
                          placeholder="Closed"
                          value={formData.office_hours.sunday}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            office_hours: { ...formData.office_hours, sunday: e.target.value }
                          })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="content">Content (HTML)</Label>
                  <Textarea
                    id="content"
                    placeholder="HTML content for the page"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPage ? 'Update Page' : 'Create Page'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Footer Pages ({pages.length})</span>
          </CardTitle>
          <CardDescription>
            Manage static pages that appear in the footer and are accessible site-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{page.title}</span>
                        <a 
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.is_published ? "default" : "secondary"}>
                        {page.is_published ? (
                          <><Eye className="h-3 w-3 mr-1" />Published</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" />Draft</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(page.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublished(page.id, page.is_published)}
                          title={page.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {page.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(page)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Footer Page</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{page.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(page.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 