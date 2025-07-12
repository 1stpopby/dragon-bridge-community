import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Download, ExternalLink, FileText, Video, Globe, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ResourceDialog } from "./ResourceDialog";

interface ResourceCardProps {
  resource: any;
  onResourceChanged: () => void;
}

export function ResourceCard({ resource, onResourceChanged }: ResourceCardProps) {
  const [canManageResources, setCanManageResources] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

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
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanManageResources(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [user, profile]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;

      toast({
        title: "Resource deleted successfully",
        description: "The resource has been removed from the library.",
      });

      onResourceChanged();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error deleting resource",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleResourceClick = async () => {
    // Increment view count for videos and websites
    if (resource.resource_type === 'video' || resource.resource_type === 'website') {
      try {
        await supabase
          .from('resources')
          .update({ view_count: (resource.view_count || 0) + 1 })
          .eq('id', resource.id);
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    }

    // Open link for websites and videos
    if (resource.content_url) {
      window.open(resource.content_url, '_blank');
    }
  };

  const handleDownload = async () => {
    // Increment download count
    try {
      await supabase
        .from('resources')
        .update({ download_count: (resource.download_count || 0) + 1 })
        .eq('id', resource.id);
    } catch (error) {
      console.error('Error updating download count:', error);
    }

    // Open download link if available
    if (resource.content_url) {
      window.open(resource.content_url, '_blank');
    }
  };

  const getIcon = () => {
    switch (resource.resource_type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'website':
        return <Globe className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getVariantForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'healthcare': return 'default';
      case 'finance': return 'secondary';
      case 'education': return 'outline';
      case 'housing': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
      {resource.resource_type === 'video' && (
        <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
          <Video className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant={getVariantForCategory(resource.category)}>
            {resource.category}
          </Badge>
          <div className="flex items-center gap-2">
            {resource.resource_type === 'video' && resource.duration && (
              <span className="text-sm text-muted-foreground">{resource.duration}</span>
            )}
            {(resource.resource_type === 'guide' || resource.resource_type === 'document') && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Download className="h-4 w-4 mr-1" />
                {resource.download_count || 0}
              </div>
            )}
            {(resource.resource_type === 'video' || resource.resource_type === 'website') && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Eye className="h-4 w-4 mr-1" />
                {resource.view_count || 0}
              </div>
            )}
            {canManageResources && (
              <div className="flex gap-1">
                <ResourceDialog
                  resource={resource}
                  onResourceSaved={onResourceChanged}
                  mode="edit"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
          {getIcon()}
          {resource.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground mb-4">{resource.description}</p>
        
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {resource.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            By {resource.author_name}
          </span>
          
          {resource.resource_type === 'website' ? (
            <Button size="sm" variant="outline" onClick={handleResourceClick}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit
            </Button>
          ) : resource.resource_type === 'video' ? (
            <Button size="sm" onClick={handleResourceClick}>
              <Video className="h-4 w-4 mr-2" />
              Watch
            </Button>
          ) : (
            <Button size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}