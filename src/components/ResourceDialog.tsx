import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Plus, Edit2, Lock, Building2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface ResourceDialogProps {
  resource?: any;
  onResourceSaved: () => void;
  mode?: 'create' | 'edit';
}

export function ResourceDialog({ resource, onResourceSaved, mode = 'create' }: ResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canManageResources, setCanManageResources] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    category: resource?.category || 'General',
    resource_type: resource?.resource_type || 'guide',
    content_url: resource?.content_url || '',
    duration: resource?.duration || '',
    tags: resource?.tags?.join(', ') || '',
    author_name: resource?.author_name || ''
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const categories = [
    'General', 'Healthcare', 'Finance', 'Education', 'Housing', 
    'Employment', 'Legal', 'Culture', 'Government', 'Technology'
  ];

  const resourceTypes = [
    { value: 'guide', label: 'Guide/Document' },
    { value: 'video', label: 'Video' },
    { value: 'website', label: 'Website/Link' },
    { value: 'document', label: 'Document' }
  ];

  // Check if user can manage resources (admin or company profile)
  const checkPermissions = async () => {
    if (!user) {
      setCanManageResources(false);
      setIsAdmin(false);
      return;
    }

    try {
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      const userIsAdmin = !!adminData;
      setIsAdmin(userIsAdmin);

      // Check if user can manage resources (admin or company profile)
      const canManage = userIsAdmin || (profile?.account_type === 'company');
      setCanManageResources(canManage);

      // Set default author name based on user profile
      if (mode === 'create' && profile && !formData.author_name) {
        setFormData(prev => ({
          ...prev,
          author_name: profile.display_name
        }));
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanManageResources(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [user, profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.category || !formData.resource_type) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const resourceData = {
        ...formData,
        author_name: mode === 'create' && profile ? profile.display_name : formData.author_name,
        user_id: mode === 'create' && user ? user.id : resource?.user_id,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('resources')
          .insert([resourceData]);

        if (error) throw error;

        toast({
          title: "Resource created successfully!",
          description: "The resource has been added to the library.",
        });
      } else {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', resource.id);

        if (error) throw error;

        toast({
          title: "Resource updated successfully!",
          description: "The resource has been updated.",
        });
      }

      setOpen(false);
      onResourceSaved();
      
      if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          category: 'General',
          resource_type: 'guide',
          content_url: '',
          duration: '',
          tags: '',
          author_name: profile?.display_name || ''
        });
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error saving resource",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          !user || !profile ? (
            <Button asChild size="default">
              <Link to="/auth" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Sign in to Add Resource
              </Link>
            </Button>
          ) : canManageResources ? (
            <Button size="default">
              <Plus className="h-4 w-4 mr-2" />
              {isAdmin ? (
                <>
                  <Shield className="h-4 w-4 mr-1" />
                  Add Resource
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-1" />
                  Add Resource
                </>
              )}
            </Button>
          ) : null
        ) : (
          <Button variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Resource' : 'Edit Resource'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Resource title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource_type">Type *</Label>
              <Select value={formData.resource_type} onValueChange={(value) => handleInputChange('resource_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.resource_type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g., 15 mins"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this resource covers..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_url">
              {formData.resource_type === 'website' ? 'Website URL' : 
               formData.resource_type === 'video' ? 'Video URL' : 'Content URL'}
            </Label>
            <Input
              id="content_url"
              value={formData.content_url}
              onChange={(e) => handleInputChange('content_url', e.target.value)}
              placeholder={
                formData.resource_type === 'website' ? 'https://example.com' :
                formData.resource_type === 'video' ? 'https://youtube.com/watch?v=...' :
                'URL for downloads or external links'
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="NHS, Healthcare, Registration"
            />
          </div>

          {mode === 'create' && profile && (
            <div className="space-y-2">
              <Label>Author</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{profile.display_name}</p>
                {profile.company_name && (
                  <p className="text-xs text-muted-foreground">{profile.company_name}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 
                (mode === 'create' ? "Adding..." : "Updating...") : 
                (mode === 'create' ? "Add Resource" : "Update Resource")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}