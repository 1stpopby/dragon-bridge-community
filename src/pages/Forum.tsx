import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, Search, TrendingUp, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ForumPostDialog } from "@/components/ForumPostDialog";
import { ForumPostCard } from "@/components/ForumPostCard";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";

const Forum = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<'latest' | 'trending' | 'unanswered'>('latest');
  const [stats, setStats] = useState({
    onlineUsers: 0,
    todayPosts: 0,
    totalMembers: 0
  });

  const categories = [
    { name: "General Discussion", posts: 1250, color: "bg-blue-100 text-blue-800" },
    { name: "Food & Dining", posts: 890, color: "bg-orange-100 text-orange-800" },
    { name: "Healthcare", posts: 654, color: "bg-green-100 text-green-800" },
    { name: "Education", posts: 543, color: "bg-purple-100 text-purple-800" },
    { name: "Housing", posts: 432, color: "bg-yellow-100 text-yellow-800" },
    { name: "Jobs & Careers", posts: 321, color: "bg-pink-100 text-pink-800" }
  ];

  const fetchStats = async () => {
    try {
      // Get total members count
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get today's posts count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayPostsCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // For online users, we'll use a simple estimation based on recent activity
      // In a real app, you'd use Supabase realtime presence for accurate online count
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { count: recentActivityCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo.toISOString());

      setStats({
        onlineUsers: Math.max(recentActivityCount || 0, 5), // Minimum 5 to look realistic
        todayPosts: todayPostsCount || 0,
        totalMembers: membersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPosts = async (filter: 'latest' | 'trending' | 'unanswered' = currentFilter) => {
    try {
      setLoading(true);
      
      // Fetch all replies first to calculate reply counts
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Group replies by post_id
      const repliesByPost: Record<string, any[]> = {};
      repliesData?.forEach((reply) => {
        if (!repliesByPost[reply.post_id]) {
          repliesByPost[reply.post_id] = [];
        }
        repliesByPost[reply.post_id].push(reply);
      });

      let postsQuery = supabase.from('forum_posts').select('*');

      // Apply filtering/sorting based on current filter
      switch (filter) {
        case 'latest':
          postsQuery = postsQuery.order('created_at', { ascending: false });
          break;
        case 'trending':
          // For trending, we'll order by creation date but prioritize posts with more recent activity
          // This is a simple implementation - in a real app you might want more sophisticated trending logic
          postsQuery = postsQuery.order('created_at', { ascending: false });
          break;
        case 'unanswered':
          // We'll fetch all posts and filter out those with replies in JavaScript
          // since we can't easily do complex joins with RLS policies
          postsQuery = postsQuery.order('created_at', { ascending: false });
          break;
      }

      const { data: postsData, error: postsError } = await postsQuery;
      if (postsError) throw postsError;

      let filteredPosts = postsData || [];

      // Get all unique user_ids from posts and replies
      const userIds = new Set<string>();
      filteredPosts.forEach(post => {
        if (post.user_id) userIds.add(post.user_id);
      });
      repliesData?.forEach(reply => {
        if (reply.user_id) userIds.add(reply.user_id);
      });

      // Fetch profile data for all users
      let profilesMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', Array.from(userIds));

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesData?.forEach(profile => {
            profilesMap[profile.user_id] = profile;
          });
        }
      }

      // Add avatar information to posts
      filteredPosts = filteredPosts.map(post => ({
        ...post,
        author_avatar: post.user_id ? profilesMap[post.user_id]?.avatar_url : null
      }));

      // Add avatar information to replies
      const enrichedRepliesByPost: Record<string, any[]> = {};
      Object.keys(repliesByPost).forEach(postId => {
        enrichedRepliesByPost[postId] = repliesByPost[postId].map(reply => ({
          ...reply,
          author_avatar: reply.user_id ? profilesMap[reply.user_id]?.avatar_url : null
        }));
      });

      // Additional filtering for unanswered posts
      if (filter === 'unanswered') {
        filteredPosts = filteredPosts.filter(post => !repliesByPost[post.id] || repliesByPost[post.id].length === 0);
      }

      // For trending, sort by posts that have replies but are still recent
      if (filter === 'trending') {
        filteredPosts = filteredPosts.sort((a, b) => {
          const aReplyCount = repliesByPost[a.id]?.length || 0;
          const bReplyCount = repliesByPost[b.id]?.length || 0;
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          
          // Trending score: (replies * 1000) + recency score
          const aScore = (aReplyCount * 1000) + (aDate / 1000);
          const bScore = (bReplyCount * 1000) + (bDate / 1000);
          
          return bScore - aScore;
        });
      }

      setPosts(filteredPosts);
      setRepliesMap(enrichedRepliesByPost);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
    fetchStats(); // Refresh stats when new post is created
  };

  const handleFilterChange = (filter: 'latest' | 'trending' | 'unanswered') => {
    setCurrentFilter(filter);
    fetchPosts(filter);
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-16 md:pb-0">
      <Navigation />
      
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Professional Forum
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Engage in meaningful discussions with our community of professionals and residents across the UK.
            </p>
          </div>
          
          {/* Enhanced Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search discussions, topics, or users..." 
                className="pl-12 h-12 text-base border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <ForumPostDialog onPostCreated={handlePostCreated} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Community Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Online</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.onlineUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Today</span>
                  </div>
                  <span className="font-bold text-purple-600">{stats.todayPosts.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Members</span>
                  </div>
                  <span className="font-bold text-orange-600">{stats.totalMembers.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Professional Categories */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white">Discussion Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category, index) => (
                  <div key={index} className="group flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
                      <div>
                        <div className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {category.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {category.posts.toLocaleString()} discussions
                        </div>
                      </div>
                    </div>
                    <MessageSquare className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-transparent rounded-xl overflow-hidden">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-xl px-6 py-4 mb-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Latest Discussions</h2>
                  <div className="flex gap-2">
                    <Button
                      variant={currentFilter === 'latest' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleFilterChange('latest')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Latest
                    </Button>
                    <Button
                      variant={currentFilter === 'trending' ? 'default' : 'ghost'}
                      size="sm"
                      className={`rounded-lg ${currentFilter === 'trending' ? '' : 'text-slate-600 hover:text-slate-900'}`}
                      onClick={() => handleFilterChange('trending')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trending
                    </Button>
                    <Button
                      variant={currentFilter === 'unanswered' ? 'default' : 'ghost'}
                      size="sm"
                      className={`rounded-lg ${currentFilter === 'unanswered' ? '' : 'text-slate-600 hover:text-slate-900'}`}
                      onClick={() => handleFilterChange('unanswered')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Unanswered
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading discussions...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No discussions yet</h3>
                    <p className="text-slate-600 dark:text-slate-400">Be the first to start a meaningful conversation!</p>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div key={`forum-${post.id}`}>
                      {/* Insert ad after 1st post, then every 4 posts */}
                      {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                        <div className="mb-6">
                          <AdvertisementBanner 
                            location="forum" 
                            variant="card" 
                            maxAds={1}
                          />
                        </div>
                      )}
                      <ForumPostCard
                        post={post}
                        onClick={() => {
                          // Handle post click - could navigate to post detail
                          console.log('Post clicked:', post.id);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavigation />
    </div>
  );
};

export default Forum;