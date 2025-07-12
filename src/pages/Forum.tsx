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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Community Forum
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow Chinese residents, ask questions, share experiences, 
              and help build our supportive community across the UK.
            </p>
          </div>
          
          {/* Search and New Post */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search discussions..." 
                className="pl-10"
              />
            </div>
            <ForumPostDialog onPostCreated={fetchPosts} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Discussions</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Latest</Button>
                <Button variant="ghost" size="sm">Trending</Button>
                <Button variant="ghost" size="sm">Unanswered</Button>
              </div>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No posts yet. Be the first to start a discussion!</p>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.posts} posts</div>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-semibold">15,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posts Today</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Online Now</span>
                  <span className="font-semibold">1,043</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Forum;