import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, Award, MessageSquare, Search, Plus, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GroupDialog } from "@/components/GroupDialog";
import { GroupCard } from "@/components/GroupCard";
import { useToast } from "@/hooks/use-toast";

const Community = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventsThisMonth, setEventsThisMonth] = useState(0);
  const { toast } = useToast();

  // Remove the fake featuredMembers array and replace with real community highlights
  const [communityHighlights, setCommunityHighlights] = useState({
    activeGroupsCount: 0,
    totalMembersCount: 0,
    recentEventsCount: 0,
    topCategories: [] as string[]
  });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error loading groups",
        description: "Failed to load community groups from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsThisMonth = async () => {
    try {
      // Get the first and last day of current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      setEventsThisMonth(eventsCount || 0);
    } catch (error) {
      console.error('Error fetching events count:', error);
      setEventsThisMonth(0);
    }
  };

  const fetchCommunityHighlights = async () => {
    try {
      // Get active groups count
      const activeGroupsCount = groups.length;
      
      // Get total members count
      const totalMembersCount = groups.reduce((sum, group) => sum + (group.member_count || 0), 0);
      
      // Get recent events count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentEventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      // Get top categories
      const categoryCount: { [key: string]: number } = {};
      groups.forEach(group => {
        if (group.category) {
          categoryCount[group.category] = (categoryCount[group.category] || 0) + 1;
        }
      });
      
      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      setCommunityHighlights({
        activeGroupsCount,
        totalMembersCount,
        recentEventsCount: recentEventsCount || 0,
        topCategories
      });
    } catch (error) {
      console.error('Error fetching community highlights:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchEventsThisMonth();
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      fetchCommunityHighlights();
    }
  }, [groups]);

  const filterGroups = (groupList: any[], searchTerm: string) => {
    if (!searchTerm) return groupList;
    return groupList.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredGroups = filterGroups(groups, searchTerm);

  // Calculate stats from actual data
  const totalMembers = groups.reduce((sum, group) => sum + (group.member_count || 0), 0);
  const totalGroups = groups.length;
  const uniqueLocations = new Set(groups.map(group => group.location)).size;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Community
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with Chinese communities across the UK. Find your local group, 
              meet like-minded people, and build lasting friendships.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalMembers}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalGroups}</div>
              <div className="text-sm text-muted-foreground">Local Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{eventsThisMonth}</div>
              <div className="text-sm text-muted-foreground">Events This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{uniqueLocations}</div>
              <div className="text-sm text-muted-foreground">Cities Covered</div>
            </div>
          </div>

          {/* Search and Create Group */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search groups..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <GroupDialog onGroupSaved={fetchGroups} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="groups">
              Community Groups ({filteredGroups.length})
            </TabsTrigger>
            <TabsTrigger value="leaders">Featured Leaders</TabsTrigger>
          </TabsList>

          <TabsContent value="groups">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No groups match your search.' : 'No groups yet. Create the first one!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onGroupChanged={fetchGroups}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaders">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Community Highlights</h3>
                <p className="text-muted-foreground">
                  Discover what makes our community special across the UK
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-border text-center">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{communityHighlights.activeGroupsCount}</h3>
                    <p className="text-muted-foreground">Active Groups</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Bringing together {communityHighlights.totalMembersCount} members
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border text-center">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{communityHighlights.recentEventsCount}</h3>
                    <p className="text-muted-foreground">Recent Events</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      In the last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border text-center">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{communityHighlights.topCategories.length}</h3>
                    <p className="text-muted-foreground">Top Categories</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {communityHighlights.topCategories.join(', ') || 'Various interests'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <h4 className="text-lg font-semibold mb-2">Want to become a community leader?</h4>
                <p className="text-muted-foreground mb-4">
                  Start by creating a group, organizing events, or helping others in our community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Discussion
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Community;