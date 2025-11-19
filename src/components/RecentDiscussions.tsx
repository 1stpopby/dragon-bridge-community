import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Discussion {
  id: string;
  title: string;
  category: string;
  replies: number;
  created_at: string;
  trending: boolean;
}

const RecentDiscussions = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const getCategoryFromTitle = (title: string): string => {
    const titleLower = title.toLowerCase();
    
    // Define keywords for different categories
    const categoryKeywords = {
      "Community Support": ["help", "support", "advice", "question", "how to", "need", "problem", "issue"],
      "Local Events": ["event", "meetup", "gathering", "celebration", "festival", "party", "activity"],
      "Services & Business": ["business", "service", "professional", "work", "job", "career", "company"],
      "Culture & Lifestyle": ["culture", "tradition", "food", "recipe", "lifestyle", "hobby", "interest"],
      "Questions & Help": ["?", "question", "help", "how", "what", "where", "when", "why"]
    };

    // Check for keywords in title
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }

    // Default category if no keywords match
    return "General Discussion";
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "General Discussion": "bg-blue-100 text-blue-800",
      "Community Support": "bg-green-100 text-green-800",
      "Local Events": "bg-purple-100 text-purple-800",
      "Services & Business": "bg-orange-100 text-orange-800",
      "Culture & Lifestyle": "bg-pink-100 text-pink-800",
      "Questions & Help": "bg-yellow-100 text-yellow-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      
      // Fetch recent forum posts with reply counts
      const { data: posts, error: postsError } = await supabase
        .from('forum_posts')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;

      if (posts) {
        // Get reply counts for each post
        const discussionsWithReplies = await Promise.all(
          posts.map(async (post) => {
            const { count: replyCount } = await supabase
              .from('forum_replies')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Simple trending logic: posts with more than 5 replies are trending
            const trending = (replyCount || 0) > 5;

            return {
              id: post.id,
              title: post.title,
              category: getCategoryFromTitle(post.title), // Dynamic category assignment
              replies: replyCount || 0,
              created_at: post.created_at,
              trending
            };
          })
        );

        setDiscussions(discussionsWithReplies);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast({
        title: "Error loading discussions",
        description: "Failed to load recent discussions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recent Discussions
            </h2>
            <p className="text-lg text-muted-foreground">
              Join the conversation and get help from our community
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/forum">View All Discussions</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No discussions yet</p>
            <p className="text-muted-foreground text-sm">Be the first to start a conversation!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {discussions.map((discussion) => (
              <Link key={discussion.id} to={`/forum/${discussion.id}`}>
                <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 mr-2">
                        {discussion.title}
                      </CardTitle>
                      {discussion.trending && (
                        <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`w-fit ${getCategoryColor(discussion.category)}`}
                    >
                      {discussion.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{discussion.replies} replies</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(discussion.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentDiscussions;