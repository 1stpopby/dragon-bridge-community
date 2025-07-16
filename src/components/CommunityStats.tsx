import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Stats {
  totalMembers: number;
  totalEvents: number;
  totalPosts: number;
  totalGroups: number;
}

const CommunityStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalEvents: 0,
    totalPosts: 0,
    totalGroups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all stats in parallel
      const [
        { count: membersCount },
        { count: eventsCount },
        { count: postsCount },
        { count: groupsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
        supabase.from('community_groups').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalMembers: membersCount || 0,
        totalEvents: eventsCount || 0,
        totalPosts: postsCount || 0,
        totalGroups: groupsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
    }
    return num.toString() + (num > 0 ? '+' : '');
  };

  const statsData = [
    { number: formatNumber(stats.totalMembers), label: "Community Members" },
    { number: formatNumber(stats.totalGroups), label: "Active Groups" },
    { number: formatNumber(stats.totalEvents), label: "Events Hosted" },
    { number: formatNumber(stats.totalPosts), label: "Discussions Started" }
  ];

  return (
    <div className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Growing Together Across the UK
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our community spans from London to Edinburgh, creating connections and 
            opportunities for Chinese residents throughout the United Kingdom.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityStats;