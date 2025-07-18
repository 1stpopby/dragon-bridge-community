import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Calendar,
  Star,
  Loader2,
  Eye,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface CompletedService {
  service_response_id: string;
  request_id: string;
  service_type: string;
  service_description: string;
  service_date: string;
  response_message: string;
  estimated_cost: string | null;
  completion_date: string;
  inquirer_name: string;
  inquirer_email: string;
}

interface CompanyGalleryItem {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  image_url: string;
  project_type: string | null;
  completion_date: string | null;
  is_featured: boolean;
  service_response_id?: string | null;
  created_at: string;
  updated_at: string;
  // Linked completed service data
  completed_service?: any;
}

interface CompanyGalleryTabProps {
  companyId: string;
  isOwner: boolean;
}

const CompanyGalleryTab = ({ companyId, isOwner }: CompanyGalleryTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [galleryItems, setGalleryItems] = useState<CompanyGalleryItem[]>([]);
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [editingItem, setEditingItem] = useState<CompanyGalleryItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_type: "",
    completion_date: "",
    is_featured: false,
    service_response_id: ""
  });

  useEffect(() => {
    fetchGalleryItems();
    fetchCompletedServices();
  }, [companyId]);

  const fetchGalleryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('company_gallery')
        .select(`
          *,
          completed_service:service_request_responses!service_response_id(
            id,
            request_id,
            company_id,
            response_message,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .order('is_featured', { ascending: false })
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setGalleryItems(data || []);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      toast({
        title: "Error loading gallery",
        description: "Failed to load company gallery.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedServices = async () => {
    try {
      // Fallback to direct query since the function might not exist yet
      const { data, error } = await supabase
        .from('service_request_responses')
        .select('id, request_id, company_id, response_message, created_at')
        .eq('company_id', companyId)
        .eq('response_status', 'completed')
        .order('created_at', { ascending: false });

      console.log('Fetched completed services:', data);
      console.log('Company ID for services:', companyId);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        service_response_id: item.id,
        request_id: item.request_id,
        service_type: 'Completed Service', // Default value
        service_description: item.response_message,
        service_date: item.created_at,
        response_message: item.response_message,
        estimated_cost: null,
        completion_date: item.created_at,
        inquirer_name: 'Client', // Default value
        inquirer_email: '' // Default value
      }));
      
      setCompletedServices(transformedData);
    } catch (error) {
      console.error('Error fetching completed services:', error);
      setCompletedServices([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `gallery/${companyId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images') // Reusing existing bucket
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for this gallery item.",
        variant: "destructive",
      });
      return;
    }

    if (!editingItem && !selectedImage) {
      toast({
        title: "Image required",
        description: "Please select an image for this gallery item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.service_response_id) {
      toast({
        title: "Completed service required",
        description: "Please select a completed service for this gallery item.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = editingItem?.image_url;

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      // Get the selected completed service details
      const selectedService = completedServices.find(s => s.service_response_id === formData.service_response_id);
      const completionDate = selectedService ? selectedService.completion_date : formData.completion_date;

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('company_gallery')
          .update({
            title: formData.title,
            description: formData.description || null,
            project_type: formData.project_type || null,
            completion_date: completionDate || null,
            is_featured: formData.is_featured,
            image_url: imageUrl,
            service_response_id: formData.service_response_id || null
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: "Gallery item updated",
          description: "Gallery item has been updated successfully.",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('company_gallery')
          .insert({
            company_id: companyId,
            title: formData.title,
            description: formData.description || null,
            project_type: formData.project_type || null,
            completion_date: completionDate || null,
            is_featured: formData.is_featured,
            image_url: imageUrl!,
            service_response_id: formData.service_response_id || null
          });

        if (error) throw error;

        toast({
          title: "Gallery item added",
          description: "New gallery item has been added successfully.",
        });
      }

      resetForm();
      fetchGalleryItems();
    } catch (error) {
      console.error('Error saving gallery item:', error);
      toast({
        title: "Error saving gallery item",
        description: "Failed to save gallery item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;

    try {
      const { error } = await supabase
        .from('company_gallery')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Gallery item deleted",
        description: "Gallery item has been deleted successfully.",
      });

      fetchGalleryItems();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      toast({
        title: "Error deleting gallery item",
        description: "Failed to delete gallery item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project_type: "",
      completion_date: "",
      is_featured: false,
      service_response_id: ""
    });
    setEditingItem(null);
    setSelectedImage(null);
    setPreviewUrl("");
    setIsDialogOpen(false);
  };

  const openEditDialog = (item: CompanyGalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      project_type: item.project_type || "",
      completion_date: item.completion_date || "",
      is_featured: item.is_featured,
      service_response_id: item.service_response_id || ""
    });
    setPreviewUrl(item.image_url);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Completed Projects Gallery</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Gallery Item' : 'Add New Project'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="service_response_id">Completed Service *</Label>
                  <Select
                    value={formData.service_response_id}
                    onValueChange={(value) => setFormData({ ...formData, service_response_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a completed service" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedServices.map((service) => (
                        <SelectItem key={service.service_response_id} value={service.service_response_id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.service_type}</span>
                            <span className="text-xs text-muted-foreground">
                              {service.inquirer_name} - {format(new Date(service.completion_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {completedServices.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No completed services found. Complete a service first to add it to your gallery.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., E-commerce Website Redesign"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the project and its outcomes..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web Development">Web Development</SelectItem>
                      <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                      <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                      <SelectItem value="Branding">Branding</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="image">Project Image {!editingItem && '*'}</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    required={!editingItem}
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-w-xs h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_featured">Featured Project</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Update Project' : 'Add Project'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {galleryItems.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No completed projects yet</p>
          {isOwner && (
            <div className="text-sm text-muted-foreground mt-2 space-y-1">
              <p>Showcase your completed work to attract new clients</p>
              {completedServices.length === 0 && (
                <p className="text-orange-600">
                  Complete a service first to add it to your gallery
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item) => (
            <Card key={item.id} className={item.is_featured ? 'ring-2 ring-primary' : ''}>
              <div className="relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                {item.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                {item.service_response_id && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {item.project_type && (
                    <Badge variant="outline" className="text-xs">
                      {item.project_type}
                    </Badge>
                  )}
                  {item.service_response_id && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed Service
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                
                {item.completion_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Completed {format(new Date(item.completion_date), 'MMM yyyy')}</span>
                  </div>
                )}

                {/* Completed Service Info */}
                {item.completed_service && (
                  <div className="p-2 bg-muted rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Linked Service:</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                    <p className="text-muted-foreground truncate">
                      {item.completed_service.response_message}
                    </p>
                  </div>
                )}
                
                {isOwner && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyGalleryTab; 