import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminEventsTable } from "@/components/admin/AdminEventsTable";
import { AdminGroupsTable } from "@/components/admin/AdminGroupsTable";
import { AdminMarketplaceTable } from "@/components/admin/AdminMarketplaceTable";
import { AdminResourcesTable } from "@/components/admin/AdminResourcesTable";
import { AdminPostsTable } from "@/components/admin/AdminPostsTable";
import { AdminRepliesTable } from "@/components/admin/AdminRepliesTable";
import { AdminNotificationsTable } from "@/components/admin/AdminNotificationsTable";
import { AdminUserRolesTable } from "@/components/admin/AdminUserRolesTable";
import { AdminUserBansTable } from "@/components/admin/AdminUserBansTable";
import { AdminCategoriesTable } from "@/components/admin/AdminCategoriesTable";
import { AdminSettingsTable } from "@/components/admin/AdminSettingsTable";
import { AdminAnnouncementsTable } from "@/components/admin/AdminAnnouncementsTable";
import { AdminAdvertisementsTable } from "@/components/admin/AdminAdvertisementsTable";
import { AdminFooterPagesTable } from "@/components/admin/AdminFooterPagesTable";
import { AdminServicesTable } from "@/components/admin/AdminServicesTable";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalReplies: 0,
    totalUsers: 0,
    postsToday: 0,
    totalEvents: 0,
    totalMarketplaceItems: 0,
    totalGroups: 0,
    totalResources: 0,
    totalServices: 0
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
        { count: resourcesCount },
        { count: servicesCount }
      ] = await Promise.all([
        supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
        supabase.from('forum_replies').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        supabase.from('community_groups').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true })
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
        totalResources: resourcesCount || 0,
        totalServices: servicesCount || 0
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

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
    fetchStats();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-muted-foreground">
                  Monitor community activity and manage platform content
                </p>
              </div>
              <Badge variant="outline" className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Real-time Data</span>
              </Badge>
            </div>
            <AdminStats stats={stats} loading={loading} onRefresh={fetchStats} />
          </div>
        );
      case "users":
        return <AdminUsersTable onDataChange={handleDataChange} />;
      case "categories":
        return <AdminCategoriesTable onDataChange={handleDataChange} />;
      case "events":
        return <AdminEventsTable onDataChange={handleDataChange} />;
      case "groups":
        return <AdminGroupsTable onDataChange={handleDataChange} />;
      case "marketplace":
        return <AdminMarketplaceTable onDataChange={handleDataChange} />;
      case "resources":
        return <AdminResourcesTable onDataChange={handleDataChange} />;
      case "services":
        return <AdminServicesTable onDataChange={handleDataChange} />;
      case "posts":
        return <AdminPostsTable onDataChange={handleDataChange} />;
      case "replies":
        return <AdminRepliesTable onDataChange={handleDataChange} />;
      case "announcements":
        return <AdminAnnouncementsTable onDataChange={handleDataChange} />;
      case "advertisements":
        return <AdminAdvertisementsTable onDataChange={handleDataChange} />;
      case "notifications":
        return <AdminNotificationsTable onDataChange={handleDataChange} />;
      case "roles":
        return <AdminUserRolesTable onDataChange={handleDataChange} />;
      case "bans":
        return <AdminUserBansTable onDataChange={handleDataChange} />;
      case "settings":
        return <AdminSettingsTable onDataChange={handleDataChange} />;
      case "footer-pages":
        return <AdminFooterPagesTable onDataChange={handleDataChange} />;
      default:
        return <AdminStats stats={stats} loading={loading} onRefresh={fetchStats} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          {/* Mobile header with sidebar trigger */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger className="mr-2" />
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Activity className="h-3 w-3" />
                  <span>Admin Panel</span>
                </Badge>
              </div>
            </div>
          </header>

          {/* Main content */}
          <div className="container mx-auto p-6 space-y-6">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;