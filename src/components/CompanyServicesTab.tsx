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
  Briefcase, 
  DollarSign, 
  Tag,
  Loader2,
  ExternalLink,
  Star,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface CompanyService {
  id: string;
  company_id: string;
  service_name: string;
  service_description: string | null;
  service_category: string | null;
  price_range: string | null;
  is_active: boolean;
  service_id?: string | null;
  created_at: string;
  updated_at: string;
  // Linked service data
  linked_service?: any;
  // Statistics
  total_responses?: number;
  completed_services?: number;
  average_rating?: number;
}

interface CompanyServicesTabProps {
  companyId: string;
  isOwner: boolean;
}

const CompanyServicesTab = ({ companyId, isOwner }: CompanyServicesTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<CompanyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CompanyService | null>(null);
  const [availableServices, setAvailableServices] = useState<Array<{id: string, name: string, category: string}>>([]);
  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    service_category: "",
    price_range: "",
    is_active: true,
    service_id: ""
  });

  useEffect(() => {
    fetchServices();
    fetchAvailableServices();
  }, [companyId]);

  const fetchServices = async () => {
    try {
      // Fetch company services with linked service data and statistics
      const { data, error } = await supabase
        .from('company_services')
        .select(`
          *,
          linked_service:services(id, name, category, description, location, rating, reviews_count, verified)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched company services:', data);
      console.log('Company ID for services:', companyId);

      // Fetch statistics for each service
      const servicesWithStats = await Promise.all(
        (data || []).map(async (service) => {
          // Get responses count
          const { count: responsesCount } = await supabase
            .from('service_request_responses')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('response_status', 'completed');

          // Get completed services count
          const { count: completedCount } = await supabase
            .from('service_request_responses')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('response_status', 'completed');

          // Get average rating from service feedback
          const { data: feedbackData } = await supabase
            .from('service_feedback')
            .select('rating')
            .eq('company_id', companyId);

          const avgRating = feedbackData && feedbackData.length > 0
            ? feedbackData.reduce((sum, item) => sum + item.rating, 0) / feedbackData.length
            : 0;

          return {
            ...service,
            total_responses: responsesCount || 0,
            completed_services: completedCount || 0,
            average_rating: avgRating
          };
        })
      );

      setServices(servicesWithStats);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error loading services",
        description: "Failed to load company services.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, category')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setAvailableServices(data || []);
    } catch (error) {
      console.error('Error fetching available services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_name.trim()) {
      toast({
        title: "Service name required",
        description: "Please enter a service name.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('company_services')
          .update({
            service_name: formData.service_name,
            service_description: formData.service_description || null,
            service_category: formData.service_category || null,
            price_range: formData.price_range || null,
            is_active: formData.is_active,
            service_id: formData.service_id || null
          })
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "Service updated",
          description: "Service has been updated successfully.",
        });
      } else {
        // Create new service
        const { error } = await supabase
          .from('company_services')
          .insert({
            company_id: companyId,
            service_name: formData.service_name,
            service_description: formData.service_description || null,
            service_category: formData.service_category || null,
            price_range: formData.price_range || null,
            is_active: formData.is_active,
            service_id: formData.service_id || null
          });

        if (error) throw error;

        toast({
          title: "Service added",
          description: "New service has been added successfully.",
        });
      }

      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error saving service",
        description: "Failed to save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('company_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service deleted",
        description: "Service has been deleted successfully.",
      });

      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error deleting service",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: "",
      service_description: "",
      service_category: "",
      price_range: "",
      is_active: true,
      service_id: ""
    });
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (service: CompanyService) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      service_description: service.service_description || "",
      service_category: service.service_category || "",
      price_range: service.price_range || "",
      is_active: service.is_active,
      service_id: service.service_id || ""
    });
    setIsDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
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
          <h3 className="text-lg font-semibold">Company Services</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="service_name">Service Name *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="e.g., Web Development"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="service_description">Description</Label>
                  <Textarea
                    id="service_description"
                    value={formData.service_description}
                    onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                    placeholder="Describe your service..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="service_category">Category</Label>
                  <Select
                    value={formData.service_category}
                    onValueChange={(value) => setFormData({ ...formData, service_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="service_id">Link to Your Service Listing (Optional)</Label>
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service to link" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No link</SelectItem>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="price_range">Price Range</Label>
                  <Input
                    id="price_range"
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    placeholder="e.g., $1000-$5000 or $150/hour"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active Service</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No services listed yet</p>
          {isOwner && (
            <p className="text-sm text-muted-foreground mt-2">
              Add your first service to showcase what you offer
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{service.service_name}</CardTitle>
                  {!service.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.service_category && (
                    <Badge variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {service.service_category}
                    </Badge>
                  )}
                  {service.linked_service && (
                    <Badge variant="secondary" className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Linked
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.service_description && (
                  <p className="text-sm text-muted-foreground">
                    {service.service_description}
                  </p>
                )}
                
                {service.price_range && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{service.price_range}</span>
                  </div>
                )}

                {/* Service Statistics */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{service.total_responses || 0} responses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{service.completed_services || 0} completed</span>
                  </div>
                  {service.average_rating && service.average_rating > 0 && (
                    <div className="flex items-center gap-1 col-span-2">
                      {renderStars(Math.round(service.average_rating))}
                      <span>{service.average_rating.toFixed(1)} avg rating</span>
                    </div>
                  )}
                </div>

                {/* Linked Service Info */}
                {service.linked_service && (
                  <div className="p-2 bg-muted rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Linked Service:</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{service.linked_service.name}</p>
                    <p className="text-muted-foreground">{service.linked_service.location}</p>
                  </div>
                )}
                
                {isOwner && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(service)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
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

export default CompanyServicesTab; 