import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, Award, MessageSquare, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GroupDialog } from "@/components/GroupDialog";
import { GroupCard } from "@/components/GroupCard";
import { useToast } from "@/hooks/use-toast";

const Community = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const featuredMembers = [
    {
      name: "Dr. Wei Chen",
      role: "Community Leader",
      location: "London",
      contributions: "Organized 15+ healthcare workshops",
      avatar: "/placeholder.svg"
    },
    {
      name: "Li Zhang",
      role: "Event Coordinator", 
      location: "Manchester",
      contributions: "Led 20+ cultural celebrations",
      avatar: "/placeholder.svg"
    },
    {
      name: "Alex Wang",
      role: "Youth Ambassador",
      location: "Edinburgh", 
      contributions: "Mentored 50+ students",
      avatar: "/placeholder.svg"
    }
  ];

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

  useEffect(() => {
    fetchGroups();
  }, []);

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
              <div className="text-3xl font-bold text-primary">156</div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredMembers.map((member, index) => (
                <Card key={index} className="border-border text-center">
                  <CardContent className="pt-6">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                    <Badge variant="outline" className="mb-2">{member.role}</Badge>
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {member.location}
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
                      <Award className="h-4 w-4 mr-1" />
                      {member.contributions}
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Community;