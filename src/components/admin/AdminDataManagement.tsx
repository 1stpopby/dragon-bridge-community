import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AdminDataManagement() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllData = async () => {
    try {
      setIsDeleting(true);
      
      // Call the edge function to delete all site data
      const { data, error } = await supabase.functions.invoke('delete-all-site-data', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Data Deletion Successful",
          description: `All site data has been deleted successfully. ${data.deletedTables.length} tables were cleared.`,
        });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Error deleting site data:', error);
      toast({
        title: "Error Deleting Data",
        description: error.message || "Failed to delete site data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const dataCategories = [
    { name: "Forum Posts & Replies", description: "All forum discussions and replies" },
    { name: "User Posts & Comments", description: "Feed posts and their comments" },
    { name: "Events", description: "All community events and registrations" },
    { name: "Community Groups", description: "Groups and group discussions" },
    { name: "Marketplace Items", description: "All marketplace listings and inquiries" },
    { name: "Services", description: "Service requests, responses, and feedback" },
    { name: "Notifications", description: "All user notifications" },
    { name: "User Interactions", description: "Likes, reactions, and saved posts" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Management</h2>
          <p className="text-muted-foreground">
            Manage and reset site data for testing purposes
          </p>
        </div>
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Danger Zone</span>
        </Badge>
      </div>

      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Delete All Site Data</CardTitle>
          </div>
          <CardDescription>
            This action will permanently delete all user-generated content and cannot be undone.
            Use this feature only for testing environments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {dataCategories.map((category, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Warning</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• This action will delete ALL user-generated content</p>
                  <p>• User accounts and profiles will remain intact</p>
                  <p>• System settings and admin configurations will be preserved</p>
                  <p>• This action cannot be undone</p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting All Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Site Data
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Confirm Data Deletion</span>
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Are you absolutely sure you want to delete all site data? This action will permanently remove:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>All forum posts and replies</li>
                    <li>All user posts and comments</li>
                    <li>All events and registrations</li>
                    <li>All community groups and discussions</li>
                    <li>All marketplace items and inquiries</li>
                    <li>All service requests and responses</li>
                    <li>All notifications and user interactions</li>
                  </ul>
                  <p className="text-destructive font-medium mt-3">
                    This action cannot be undone!
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete All Data"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}