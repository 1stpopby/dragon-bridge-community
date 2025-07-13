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
  Send, 
  Archive,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Building2,
  UserCog
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  target_audience: string[];
  notification_sent: boolean;
  view_count: number;
}

interface AdminAnnouncementsTableProps {
  onDataChange: () => void;
}

export function AdminAnnouncementsTable({ onDataChange }: AdminAnnouncementsTableProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [publishDate, setPublishDate] = useState<Date>();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'draft' | 'scheduled' | 'published' | 'archived';
    target_audience: string[];
    published_at: string | null;
    expires_at: string | null;
  }>({
    title: '',
    content: '',
    priority: 'normal',
    status: 'draft',
    target_audience: ['all'],
    published_at: null,
    expires_at: null,
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-gray-100 text-gray-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-purple-100 text-purple-800'
  };

  const audienceOptions = [
    { value: 'all', label: 'All Users', icon: Users },
    { value: 'users', label: 'Regular Users', icon: Users },
    { value: 'companies', label: 'Companies', icon: Building2 },
    { value: 'admins', label: 'Admins', icon: UserCog }
  ];

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error loading announcements",
        description: "Failed to fetch announcements data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      status: 'draft',
      target_audience: ['all'],
      published_at: null,
      expires_at: null,
    });
    setPublishDate(undefined);
    setExpiryDate(undefined);
    setEditingAnnouncement(null);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        status: announcement.status,
        target_audience: announcement.target_audience,
        published_at: announcement.published_at,
        expires_at: announcement.expires_at,
      });
      if (announcement.published_at) {
        setPublishDate(new Date(announcement.published_at));
      }
      if (announcement.expires_at) {
        setExpiryDate(new Date(announcement.expires_at));
      }
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const announcementData = {
        ...formData,
        created_by: user.id,
        published_at: publishDate ? publishDate.toISOString() : null,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;

        toast({
          title: "Announcement updated",
          description: "The announcement has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (error) throw error;

        toast({
          title: "Announcement created",
          description: "The announcement has been created successfully.",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
      onDataChange();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: "Error saving announcement",
        description: "Failed to save the announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Announcement deleted",
        description: "The announcement has been deleted successfully.",
      });

      fetchAnnouncements();
      onDataChange();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error deleting announcement",
        description: "Failed to delete the announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Announcement published",
        description: "The announcement is now live.",
      });

      fetchAnnouncements();
      onDataChange();
    } catch (error) {
      console.error('Error publishing announcement:', error);
      toast({
        title: "Error publishing announcement",
        description: "Failed to publish the announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Announcement archived",
        description: "The announcement has been archived.",
      });

      fetchAnnouncements();
      onDataChange();
    } catch (error) {
      console.error('Error archiving announcement:', error);
      toast({
        title: "Error archiving announcement",
        description: "Failed to archive the announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      default: return <Edit className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Create and manage community announcements
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement 
                  ? 'Update the announcement details below.' 
                  : 'Fill in the details to create a new community announcement.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Announcement content"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Target Audience</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {audienceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={formData.target_audience.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                target_audience: [...prev.target_audience, option.value]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                target_audience: prev.target_audience.filter(a => a !== option.value)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={option.value} className="flex items-center space-x-1">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Publish Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !publishDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {publishDate ? format(publishDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={publishDate}
                        onSelect={setPublishDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>
            Manage community announcements and their scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading announcements...</div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No announcements found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        {getPriorityIcon(announcement.priority)}
                        <Badge className={priorityColors[announcement.priority]}>
                          {announcement.priority}
                        </Badge>
                        <Badge className={statusColors[announcement.status]}>
                          {getStatusIcon(announcement.status)}
                          {announcement.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Target: {announcement.target_audience.join(', ')}</span>
                        <span>Views: {announcement.view_count}</span>
                        {announcement.published_at && (
                          <span>Published: {format(new Date(announcement.published_at), 'MMM d, yyyy')}</span>
                        )}
                        {announcement.expires_at && (
                          <span>Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {announcement.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(announcement.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {announcement.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(announcement.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{announcement.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(announcement.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}