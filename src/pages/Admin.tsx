import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  Store,
  FileText,
  Settings,
  Shield,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPostsTable } from "@/components/admin/AdminPostsTable";
import { AdminRepliesTable } from "@/components/admin/AdminRepliesTable";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminEventsTable } from "@/components/admin/AdminEventsTable";
import { AdminMarketplaceTable } from "@/components/admin/AdminMarketplaceTable";
import { AdminGroupsTable } from "@/components/admin/AdminGroupsTable";
import { AdminResourcesTable } from "@/components/admin/AdminResourcesTable";
import { AdminUserRolesTable } from "@/components/admin/AdminUserRolesTable";
import { AdminNotificationsTable } from "@/components/admin/AdminNotificationsTable";

const Admin = () => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalReplies: 0,
    totalUsers: 0,
    postsToday: 0,
    totalEvents: 0,
    totalMarketplaceItems: 0,
    totalGroups: 0,
    totalResources: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all counts in parallel
      const [
        { count: postsCount },
        { count: repliesCount },
        { count: usersCount },
        { count: eventsCount },
        { count: marketplaceCount },
        { count: groupsCount },
        { count: resourcesCount }
      ] = await Promise.all([
        supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
        supabase.from('forum_replies').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        supabase.from('community_groups').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('*', { count: 'exact', head: true })
      ]);

      // Fetch posts created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: postsTodayCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalPosts: postsCount || 0,
        totalReplies: repliesCount || 0,
        totalUsers: usersCount || 0,
        postsToday: postsTodayCount || 0,
        totalEvents: eventsCount || 0,
        totalMarketplaceItems: marketplaceCount || 0,
        totalGroups: groupsCount || 0,
        totalResources: resourcesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error loading stats",
        description: "Failed to load admin statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const { signOut } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-destructive text-destructive-foreground py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Administrator Panel</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-destructive-foreground hover:bg-destructive-foreground/10"
          >
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Admin Panel
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage your community forum, monitor activity, and maintain content quality.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="roles">User Roles</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminStats stats={stats} loading={loading} onRefresh={fetchStats} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="posts">
            <AdminPostsTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="replies">
            <AdminRepliesTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="events">
            <AdminEventsTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="marketplace">
            <AdminMarketplaceTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="groups">
            <AdminGroupsTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="resources">
            <AdminResourcesTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="roles">
            <AdminUserRolesTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotificationsTable onDataChange={fetchStats} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Most Active Today
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +20% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Response Time
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3h</div>
                  <p className="text-xs text-muted-foreground">
                    -12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Engagement Rate
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">84%</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">New post created</p>
                      <p className="text-sm text-muted-foreground">By Li Wei - 2 minutes ago</p>
                    </div>
                    <Badge variant="secondary">New</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Reply added</p>
                      <p className="text-sm text-muted-foreground">By Chen Ming - 5 minutes ago</p>
                    </div>
                    <Badge variant="outline">Reply</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Post edited</p>
                      <p className="text-sm text-muted-foreground">By Wang Xiao - 8 minutes ago</p>
                    </div>
                    <Badge variant="outline">Edit</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;