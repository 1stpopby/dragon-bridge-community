import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, Search, TrendingUp, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ForumPostDialog } from "@/components/ForumPostDialog";
import { ForumPostCard } from "@/components/ForumPostCard";

const Forum = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const categories = [
    { name: "General Discussion", posts: 1250, color: "bg-blue-100 text-blue-800" },
    { name: "Food & Dining", posts: 890, color: "bg-orange-100 text-orange-800" },
    { name: "Healthcare", posts: 654, color: "bg-green-100 text-green-800" },
    { name: "Education", posts: 543, color: "bg-purple-100 text-purple-800" },
    { name: "Housing", posts: 432, color: "bg-yellow-100 text-yellow-800" },
    { name: "Jobs & Careers", posts: 321, color: "bg-pink-100 text-pink-800" }
  ];

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

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

      setPosts(postsData || []);
      setRepliesMap(repliesByPost);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
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
            <ForumPostDialog onPostCreated={fetchPosts} />
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
                  <span className="font-bold text-green-600">1,043</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Today</span>
                  </div>
                  <span className="font-bold text-purple-600">156</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Members</span>
                  </div>
                  <span className="font-bold text-orange-600">15,247</span>
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-0 overflow-hidden">
              <div className="border-b border-slate-100 dark:border-slate-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Latest Discussions</h2>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" className="rounded-lg">
                      <Clock className="h-4 w-4 mr-2" />
                      Latest
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 rounded-lg">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trending
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 rounded-lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Unanswered
                    </Button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
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
                  posts.map((post) => (
                    <ForumPostCard
                      key={post.id}
                      post={post}
                      replies={repliesMap[post.id] || []}
                      onReplyAdded={fetchPosts}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Forum;