import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Star, CheckCircle, MapPin, Phone, Mail, Globe, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Service {
  id: string;
  name: string;
  specialty: string;
  category: string;
  description: string | null;
  location: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_person: string | null;
  languages: string[] | null;
  rating: number | null;
  reviews_count: number | null;
  verified: boolean | null;
  featured: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AdminServicesTableProps {
  onDataChange: () => void;
}

export const AdminServicesTable = ({ onDataChange }: AdminServicesTableProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    category: 'legal',
    description: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    contact_person: '',
    languages: [] as string[],
    verified: false,
    featured: false
  });
  const { toast } = useToast();

  const categories = [
    { value: 'legal', label: 'Legal Services' },
    { value: 'medical', label: 'Medical Services' },
    { value: 'financial', label: 'Financial Services' },
    { value: 'education', label: 'Education Services' },
    { value: 'technology', label: 'Technology Services' },
    { value: 'other', label: 'Other Services' }
  ];

  const availableLanguages = ['English', 'Mandarin', 'Cantonese', 'Wu', 'Min', 'Hakka'];

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error loading services",
        description: "Failed to load services from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('services')
        .insert({
          ...formData,
          languages: formData.languages.length > 0 ? formData.languages : null
        });

      if (error) throw error;

      toast({
        title: "Service created successfully",
        description: "The service has been added to the database.",
      });

      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        specialty: '',
        category: 'legal',
        description: '',
        location: '',
        phone: '',
        email: '',
        website: '',
        contact_person: '',
        languages: [],
        verified: false,
        featured: false
      });
      fetchServices();
      onDataChange();
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error creating service",
        description: "Failed to create the service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({
          ...formData,
          languages: formData.languages.length > 0 ? formData.languages : null
        })
        .eq('id', editingService.id);

      if (error) throw error;

      toast({
        title: "Service updated successfully",
        description: "The service has been updated in the database.",
      });

      setIsEditDialogOpen(false);
      setEditingService(null);
      fetchServices();
      onDataChange();
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error updating service",
        description: "Failed to update the service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      console.log('=== DELETE OPERATION START ===');
      console.log('Service ID to delete:', id);
      console.log('Current services count:', services.length);
      
      // First, check if the service exists
      const { data: existingService, error: checkError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('Service check error:', checkError);
        if (checkError.code === 'PGRST116') {
          toast({
            title: "Service not found",
            description: "The service may have already been deleted.",
            variant: "destructive",
          });
          return;
        }
      }

      console.log('Service exists:', existingService);

      // Check for any dependent records first (skip if table doesn't exist)
      console.log('Checking for dependent records...');
      try {
        const { data: dependentRecords, error: dependentError } = await supabase
          .from('service_requests' as any)
          .select('id')
          .eq('service_id', id)
          .limit(1);

        if (dependentError) {
          console.error('Error checking dependent records (table may not exist):', dependentError);
        } else {
          console.log('Dependent records found:', dependentRecords?.length || 0);
        }
      } catch (err) {
        console.log('Dependent records check skipped (table may not exist)');
      }

      // Now attempt the deletion
      const { data, error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('=== DELETE ERROR ===');
        console.error('Supabase delete error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          toast({
            title: "Cannot delete service",
            description: "This service has associated records that prevent deletion. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        
        // Check if it's a permission error
        if (error.code === '42501') {
          toast({
            title: "Permission denied",
            description: "You don't have permission to delete this service.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      console.log('=== DELETE SUCCESS ===');
      console.log('Delete successful, data:', data);
      console.log('Records deleted:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('No records were deleted - possible RLS issue');
        toast({
          title: "Service not found or permission denied",
          description: "The service may have already been deleted or you don't have permission to delete it.",
          variant: "destructive",
        });
        return;
      }
      
      // Force immediate UI update
      setServices(prevServices => prevServices.filter(s => s.id !== id));
      
      toast({
        title: "Service deleted successfully",
        description: "The service has been removed from the database.",
      });

      // Refresh data from database
      await fetchServices();
      onDataChange();
      
      console.log('=== DELETE OPERATION COMPLETE ===');
      console.log('New services count:', services.length);
      
    } catch (error) {
      console.error('=== DELETE OPERATION FAILED ===');
      console.error('Error deleting service:', error);
      toast({
        title: "Error deleting service",
        description: error instanceof Error ? error.message : "Failed to delete the service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleVerified = async (id: string, currentVerified: boolean) => {
    try {
      console.log('Attempting to toggle verified status for service ID:', id, 'from', currentVerified, 'to', !currentVerified);
      const { data, error } = await supabase
        .from('services')
        .update({ verified: !currentVerified })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase verified toggle error:', error);
        throw error;
      }

      console.log('Verified toggle successful, data:', data);

      toast({
        title: `Service ${!currentVerified ? 'verified' : 'unverified'} successfully`,
        description: `The service has been ${!currentVerified ? 'verified' : 'unverified'}.`,
      });

      fetchServices();
      onDataChange();
    } catch (error) {
      console.error('Error toggling verified status:', error);
      toast({
        title: "Error updating verification status",
        description: error instanceof Error ? error.message : "Failed to update the verification status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      console.log('Attempting to toggle featured status for service ID:', id, 'from', currentFeatured, 'to', !currentFeatured);
      const { data, error } = await supabase
        .from('services')
        .update({ featured: !currentFeatured })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase featured toggle error:', error);
        throw error;
      }

      console.log('Featured toggle successful, data:', data);

      toast({
        title: `Service ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`,
        description: `The service has been ${!currentFeatured ? 'featured' : 'unfeatured'}.`,
      });

      fetchServices();
      onDataChange();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: "Error updating featured status",
        description: error instanceof Error ? error.message : "Failed to update the featured status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      specialty: service.specialty,
      category: service.category,
      description: service.description || '',
      location: service.location,
      phone: service.phone || '',
      email: service.email || '',
      website: service.website || '',
      contact_person: service.contact_person || '',
      languages: service.languages || [],
      verified: service.verified || false,
      featured: service.featured || false
    });
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setFormData({
      name: '',
      specialty: '',
      category: 'legal',
      description: '',
      location: '',
      phone: '',
      email: '',
      website: '',
      contact_person: '',
      languages: [],
      verified: false,
      featured: false
    });
    setIsCreateDialogOpen(true);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ServiceForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => void, isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Service Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="specialty">Specialty</Label>
          <Input
            id="specialty"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableLanguages.map((lang) => (
            <Button
              key={lang}
              type="button"
              variant={formData.languages.includes(lang) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (formData.languages.includes(lang)) {
                  setFormData({
                    ...formData,
                    languages: formData.languages.filter(l => l !== lang)
                  });
                } else {
                  setFormData({
                    ...formData,
                    languages: [...formData.languages, lang]
                  });
                }
              }}
            >
              {lang}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="verified"
            checked={formData.verified}
            onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
          />
          <Label htmlFor="verified">Verified</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {isEdit ? 'Update Service' : 'Create Service'}
        </Button>
      </div>
    </form>
  );

  // Add this diagnostic function for testing (you can call it from browser console)
  const testDatabasePermissions = async () => {
    try {
      console.log('=== DIAGNOSTIC TEST START ===');
      
      // Test SELECT permission
      const { data: selectTest, error: selectError } = await supabase
        .from('services')
        .select('id, name')
        .limit(1);
      
      console.log('SELECT test:', selectError ? 'FAILED' : 'PASSED');
      if (selectError) console.error('SELECT error:', selectError);
      
      // Test INSERT permission (with rollback)
      const testService = {
        name: 'TEST_SERVICE_DELETE_ME',
        description: 'Test service for diagnostics',
        category: 'test',
        location: 'Test Location',
        contact_info: 'test@test.com',
        specialty: 'Testing',
        phone: '123-456-7890',
        email: 'test@test.com'
      };
      
      const { data: insertTest, error: insertError } = await supabase
        .from('services')
        .insert(testService)
        .select();
      
      console.log('INSERT test:', insertError ? 'FAILED' : 'PASSED');
      if (insertError) console.error('INSERT error:', insertError);
      
      // Test DELETE permission
      if (insertTest && insertTest[0]) {
        const { data: deleteTest, error: deleteError } = await supabase
          .from('services')
          .delete()
          .eq('id', insertTest[0].id)
          .select();
        
        console.log('DELETE test:', deleteError ? 'FAILED' : 'PASSED');
        if (deleteError) console.error('DELETE error:', deleteError);
      }
      
      console.log('=== DIAGNOSTIC TEST COMPLETE ===');
    } catch (error) {
      console.error('Diagnostic test failed:', error);
    }
  };

  // Make it available globally for console testing
  (window as any).testDatabasePermissions = testDatabasePermissions;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services Management</CardTitle>
              <CardDescription>
                Manage community services and business listings
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                  <DialogDescription>
                    Add a new service to the community directory
                  </DialogDescription>
                </DialogHeader>
                <ServiceForm onSubmit={handleCreate} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.specialty}
                            </div>
                          </div>
                          {service.featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categories.find(c => c.value === service.category)?.label || service.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{service.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {service.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{service.phone}</span>
                            </div>
                          )}
                          {service.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{service.email}</span>
                            </div>
                          )}
                          {service.website && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Website</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {service.verified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {service.rating?.toFixed(1) || 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({service.reviews_count || 0})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVerified(service.id, service.verified || false)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatured(service.id, service.featured || false)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service information
            </DialogDescription>
          </DialogHeader>
          <ServiceForm onSubmit={handleUpdate} isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}; 