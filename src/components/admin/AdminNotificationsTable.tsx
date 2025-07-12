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
  Search, 
  Bell,
  AlertCircle,
  MessageSquare,
  Calendar,
  Store,
  Users
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

interface AdminNotificationsTableProps {
  onDataChange: () => void;
}

export const AdminNotificationsTable = ({ onDataChange }: AdminNotificationsTableProps) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!inner(
            display_name,
            contact_email
          )
        `)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error loading notifications",
        description: "Failed to load notifications data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Notification deleted",
        description: "The notification has been successfully deleted.",
      });

      fetchNotifications();
      onDataChange();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error deleting notification",
        description: "Failed to delete the notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: !isRead })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: `Notification marked as ${!isRead ? 'read' : 'unread'}`,
        description: `The notification status has been updated.`,
      });

      fetchNotifications();
      onDataChange();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "Error updating notification",
        description: "Failed to update notification status. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.profiles?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'forum':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'marketplace':
        return <Store className="h-4 w-4 text-purple-500" />;
      case 'community':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'forum':
        return 'default';
      case 'event':
        return 'secondary';
      case 'marketplace':
        return 'outline';
      case 'community':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notifications Management ({filteredNotifications.length})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
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
                <TableHead>Notification</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No notifications match your search' : 'No notifications found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification.id} className={!notification.is_read ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <p className="font-medium truncate">{notification.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.content.substring(0, 60)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.profiles?.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.profiles?.contact_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(notification.type)}>
                        {notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id, notification.is_read)}
                      >
                        <Badge variant={notification.is_read ? 'outline' : 'default'}>
                          {notification.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </TableCell>
                    <TableCell>
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
                              Delete Notification
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this notification? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteNotification(notification.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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