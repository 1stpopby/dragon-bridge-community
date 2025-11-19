import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, Heart, ThumbsUp, TrendingUp, Eye, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ReportDialog } from "@/components/ReportDialog";
import { useAuth } from "@/hooks/useAuth";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  category?: string;
  user_id?: string;
}

interface ForumPostCardProps {
  post: ForumPost;
  onClick: () => void;
}

export const ForumPostCard = ({ post, onClick }: ForumPostCardProps) => {
  const [replyCount, setReplyCount] = useState(0);
  const [reactionCount, setReactionCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleCardClick = () => {
    navigate(`/forum/${post.id}`);
  };

  useEffect(() => {
    fetchCounts();
  }, [post.id]);

  const fetchCounts = async () => {
    try {
      // Get reply count
      const { count: repliesCount } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get reaction count
      const { count: reactionsCount } = await supabase
        .from('forum_post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      setReplyCount(repliesCount || 0);
      setReactionCount(reactionsCount || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div 
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 hover:border-primary/30 shadow-sm hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex space-x-4">
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            if (post.user_id) navigate(`/user/${post.user_id}`);
          }}
        >
          <Avatar className="h-12 w-12 ring-2 ring-slate-100 dark:ring-slate-700">
            <AvatarImage src={post.author_avatar} alt={post.author_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
              {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 leading-tight hover:text-primary transition-colors">
                {post.title}
              </h3>
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <span 
                  className="font-medium hover:text-primary cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post.user_id) navigate(`/user/${post.user_id}`);
                  }}
                >
                  {post.author_name}
                </span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimeAgo(post.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content Preview */}
          <div className="mb-4">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {truncateContent(post.content)}
            </p>
          </div>

          {/* Post Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
              </div>
              
              {reactionCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{reactionCount} {reactionCount === 1 ? 'reaction' : 'reactions'}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user && user.id !== post.user_id && (
                <ReportDialog
                  contentType="forum_post"
                  contentId={post.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  }
                />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Discussion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};