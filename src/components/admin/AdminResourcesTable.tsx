import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Trash2, 
  Edit, 
  Search, 
  FileText,
  AlertCircle,
  Star,
  Eye,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface AdminResourcesTableProps {
  onDataChange: () => void;
}

export const AdminResourcesTable = ({ onDataChange }: AdminResourcesTableProps) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchResources = async () => {
    try {
      setLoading(true);
      
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (resourcesError) throw resourcesError;

      setResources(resourcesData || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error loading resources",
        description: "Failed to load resources data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource deleted",
        description: "The resource has been successfully deleted.",
      });

      fetchResources();
      onDataChange();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error deleting resource",
        description: "Failed to delete the resource. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleResourceStatus = async (resourceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      
      const { error } = await supabase
        .from('resources')
        .update({ status: newStatus })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource status updated",
        description: `Resource status changed to ${newStatus}.`,
      });

      fetchResources();
      onDataChange();
    } catch (error) {
      console.error('Error updating resource status:', error);
      toast({
        title: "Error updating status",
        description: "Failed to update resource status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (resourceId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_featured: !isFeatured })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: isFeatured ? "Resource unfeatured" : "Resource featured",
        description: `Resource has been ${isFeatured ? 'removed from' : 'added to'} featured list.`,
      });

      fetchResources();
      onDataChange();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: "Error updating featured status",
        description: "Failed to update featured status. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.resource_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resources Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading resources...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resources Management ({filteredResources.length})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No resources match your search' : 'No resources found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate">{resource.title}</p>
                          {resource.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {resource.description?.substring(0, 50)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{resource.author_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{resource.resource_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{resource.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResourceStatus(resource.id, resource.status)}
                      >
                        <Badge variant={resource.status === 'published' ? 'default' : 'destructive'}>
                          {resource.status}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{resource.view_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{resource.download_count || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(resource.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(resource.id, resource.is_featured)}
                        >
                          <Star className={`h-4 w-4 ${resource.is_featured ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                        <Button variant="ghost" size="sm">
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
                              <AlertDialogTitle className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                                Delete Resource
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteResource(resource.id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};