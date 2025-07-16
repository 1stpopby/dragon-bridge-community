import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar as CalendarIcon, 
  ExternalLink, 
  Building2,
  MousePointer,
  BarChart3,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_type: 'external' | 'company';
  external_link: string | null;
  company_id: string | null;
  placement_locations: string[];
  status: 'draft' | 'active' | 'paused' | 'expired';
  priority: number;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  company_name: string;
  display_name: string;
}

interface AdminAdvertisementsTableProps {
  onDataChange: () => void;
}

export function AdminAdvertisementsTable({ onDataChange }: AdminAdvertisementsTableProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvertisement, setEditingAdvertisement] = useState<Advertisement | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    image_url: string;
    link_type: 'external' | 'company';
    external_link: string;
    company_id: string;
    placement_locations: string[];
    status: 'draft' | 'active' | 'paused' | 'expired';
    priority: number;
    start_date: string | null;
    end_date: string | null;
  }>({
    title: '',
    description: '',
    image_url: '',
    link_type: 'external',
    external_link: '',
    company_id: '',
    placement_locations: [],
    status: 'draft',
    priority: 0,
    start_date: null,
    end_date: null,
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800'
  };

  const placementOptions = [
    { value: 'home', label: 'Home Page' },
    { value: 'feed', label: 'Feed' },
    { value: 'forum', label: 'Forum' },
    { value: 'events', label: 'Events' },
    { value: 'services', label: 'Services' },
    { value: 'marketplace', label: 'Marketplace' }
  ];

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdvertisements((data || []) as Advertisement[]);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      toast({
        title: "Error loading advertisements",
        description: "Failed to fetch advertisements data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name, display_name')
        .eq('account_type', 'company')
        .order('company_name');

      if (error) throw error;
      setCompanies((data || []) as Company[]);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error loading companies",
        description: "Failed to fetch companies data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAdvertisements();
    fetchCompanies();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_type: 'external',
      external_link: '',
      company_id: '',
      placement_locations: [],
      status: 'draft',
      priority: 0,
      start_date: null,
      end_date: null,
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedFile(null);
    setEditingAdvertisement(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `advertisements/${fileName}`;

      // Use existing event-images bucket for advertisements
      const bucket = 'event-images';
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleOpenDialog = (advertisement?: Advertisement) => {
    if (advertisement) {
      setEditingAdvertisement(advertisement);
      setFormData({
        title: advertisement.title,
        description: advertisement.description,
        image_url: advertisement.image_url || '',
        link_type: advertisement.link_type,
        external_link: advertisement.external_link || '',
        company_id: advertisement.company_id || '',
        placement_locations: advertisement.placement_locations,
        status: advertisement.status,
        priority: advertisement.priority,
        start_date: advertisement.start_date,
        end_date: advertisement.end_date,
      });
      if (advertisement.start_date) {
        setStartDate(new Date(advertisement.start_date));
      }
      if (advertisement.end_date) {
        setEndDate(new Date(advertisement.end_date));
      }
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (formData.link_type === 'external' && !formData.external_link) {
      toast({
        title: "Validation Error",
        description: "External link is required when link type is external.",
        variant: "destructive",
      });
      return;
    }

    if (formData.link_type === 'company' && !formData.company_id) {
      toast({
        title: "Validation Error",
        description: "Company selection is required when link type is company.",
        variant: "destructive",
      });
      return;
    }

    if (formData.placement_locations.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one placement location must be selected.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      let imageUrl = formData.image_url;

      // Upload new image if file is selected
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      const advertisementData = {
        title: formData.title,
        description: formData.description,
        image_url: imageUrl,
        link_type: formData.link_type,
        external_link: formData.link_type === 'external' ? formData.external_link : null,
        company_id: formData.link_type === 'company' && formData.company_id ? formData.company_id : null,
        placement_locations: formData.placement_locations,
        status: formData.status,
        priority: formData.priority,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
        created_by: user.id,
      };

      if (editingAdvertisement) {
        const { error } = await supabase
          .from('advertisements')
          .update(advertisementData)
          .eq('id', editingAdvertisement.id);

        if (error) throw error;

        toast({
          title: "Advertisement updated",
          description: "The advertisement has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('advertisements')
          .insert([advertisementData]);

        if (error) throw error;

        toast({
          title: "Advertisement created",
          description: "The advertisement has been created successfully.",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchAdvertisements();
      onDataChange();
    } catch (error: any) {
      console.error('Error saving advertisement:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save the advertisement. Please try again.';
      toast({
        title: "Error saving advertisement",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Advertisement deleted",
        description: "The advertisement has been deleted successfully.",
      });

      fetchAdvertisements();
      onDataChange();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast({
        title: "Error deleting advertisement",
        description: "Failed to delete the advertisement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'paused') => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Advertisement ${newStatus}`,
        description: `The advertisement is now ${newStatus}.`,
      });

      fetchAdvertisements();
      onDataChange();
    } catch (error) {
      console.error('Error updating advertisement status:', error);
      toast({
        title: "Error updating status",
        description: "Failed to update the advertisement status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-3 w-3" />;
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'expired': return <XCircle className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const handlePlacementChange = (location: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        placement_locations: [...prev.placement_locations, location]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        placement_locations: prev.placement_locations.filter(loc => loc !== location)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advertisements</h2>
          <p className="text-muted-foreground">
            Manage advertisements displayed across the platform
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Advertisement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAdvertisement ? 'Edit Advertisement' : 'Create New Advertisement'}
              </DialogTitle>
              <DialogDescription>
                Create and manage advertisements that will be displayed across the platform.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Advertisement title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Advertisement description"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_file">Advertisement Image</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedFile(file || null);
                    }}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <div className="text-sm text-green-600 flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {selectedFile.name}
                    </div>
                  )}
                </div>
                {formData.image_url && !selectedFile && (
                  <div className="text-sm text-gray-500">
                    Current image: <span className="text-blue-600">{formData.image_url.split('/').pop()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value: 'external' | 'company') => setFormData({ ...formData, link_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External Link</SelectItem>
                    <SelectItem value="company">Company Profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.link_type === 'external' && (
                <div className="space-y-2">
                  <Label htmlFor="external_link">External Link *</Label>
                  <Input
                    id="external_link"
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
              )}

              {formData.link_type === 'company' && (
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.company_name || company.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Placement Locations *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {placementOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={formData.placement_locations.includes(option.value)}
                        onCheckedChange={(checked) => handlePlacementChange(option.value, checked as boolean)}
                      />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'active' | 'paused' | 'expired') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingAdvertisement ? 'Update' : 'Create'} Advertisement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading advertisements...</div>
      ) : (
        <div className="grid gap-4">
          {advertisements.map((ad) => (
            <Card key={ad.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{ad.title}</span>
                      <Badge className={`${statusColors[ad.status]} flex items-center space-x-1`}>
                        {getStatusIcon(ad.status)}
                        <span className="capitalize">{ad.status}</span>
                      </Badge>
                      {ad.priority > 0 && (
                        <Badge variant="outline">
                          Priority: {ad.priority}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{ad.description}</CardDescription>
                    <div className="flex flex-wrap gap-1">
                      {ad.placement_locations.map((location) => (
                        <Badge key={location} variant="secondary" className="text-xs">
                          {placementOptions.find(opt => opt.value === location)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {ad.status === 'draft' || ad.status === 'paused' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(ad.id, 'active')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : ad.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(ad.id, 'paused')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(ad)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this advertisement? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(ad.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{ad.view_count} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span>{ad.click_count} clicks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ad.link_type === 'external' ? (
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize">{ad.link_type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ad.image_url && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    <span>{ad.image_url ? 'Has Image' : 'No Image'}</span>
                  </div>
                </div>
                {(ad.start_date || ad.end_date) && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    {ad.start_date && (
                      <span>Starts: {format(new Date(ad.start_date), "PPP")}</span>
                    )}
                    {ad.start_date && ad.end_date && <span> • </span>}
                    {ad.end_date && (
                      <span>Ends: {format(new Date(ad.end_date), "PPP")}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {advertisements.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No advertisements yet</h3>
                <p className="text-muted-foreground">
                  Create your first advertisement to start promoting content across the platform.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 