import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, Reply, Heart, ThumbsUp, Smile, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
}

interface ForumReply {
  id: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
}

interface Reaction {
  id: string;
  emoji: string;
  author_name: string;
  user_id: string | null;
}

interface ForumPostCardProps {
  post: ForumPost;
  replies: ForumReply[];
  onReplyAdded: () => void;
}

export const ForumPostCard = ({ post, replies, onReplyAdded }: ForumPostCardProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const availableEmojis = [
    { emoji: "👍", name: "thumbs up" },
    { emoji: "❤️", name: "heart" },
    { emoji: "😊", name: "smile" },
    { emoji: "⭐", name: "star" },
    { emoji: "🔥", name: "fire" },
    { emoji: "👏", name: "clap" }
  ];

  // Fetch reactions when component mounts
  useEffect(() => {
    fetchReactions();
  }, [post.id]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_post_reactions')
        .select('*')
        .eq('post_id', post.id);

      if (error) throw error;
      setReactions(data || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user && !profile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to posts.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(r => 
        r.emoji === emoji && 
        (user ? r.user_id === user.id : r.author_name === (profile?.display_name || 'Anonymous'))
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('forum_post_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('forum_post_reactions')
          .insert({
            post_id: post.id,
            user_id: user?.id || null,
            author_name: profile?.display_name || 'Anonymous',
            emoji: emoji
          });

        if (error) throw error;
      }

      // Refresh reactions
      fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Error updating reaction",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getReactionCount = (emoji: string) => {
    return reactions.filter(r => r.emoji === emoji).length;
  };

  const hasUserReacted = (emoji: string) => {
    return reactions.some(r => 
      r.emoji === emoji && 
      (user ? r.user_id === user.id : r.author_name === (profile?.display_name || 'Anonymous'))
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !replyAuthor.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('forum_replies')
        .insert({
          post_id: post.id,
          content: replyContent.trim(),
          author_name: replyAuthor.trim(),
        });

      if (error) throw error;

      toast({
        title: "Reply added successfully!",
        description: "Your reply has been posted.",
      });

      setReplyContent("");
      setReplyAuthor("");
      setShowReplyForm(false);
      onReplyAdded();
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: "Error posting reply",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 hover:border-primary/30 shadow-sm hover:shadow-md">
      <div className="flex space-x-4">
        <Avatar className="h-12 w-12 ring-2 ring-slate-100 dark:ring-slate-700">
          <AvatarImage src={post.author_avatar} alt={post.author_name} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
            {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                {post.title}
              </h3>
              <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{post.author_name}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimeAgo(post.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Emoji Reactions */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            {availableEmojis.map(({ emoji, name }) => {
              const count = getReactionCount(emoji);
              const hasReacted = hasUserReacted(emoji);
              
              return (
                <Button
                  key={emoji}
                  variant={hasReacted ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleReaction(emoji)}
                  className={`h-8 px-3 rounded-full transition-all duration-200 ${
                    hasReacted 
                      ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' 
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <span className="mr-1">{emoji}</span>
                  {count > 0 && <span className="text-xs font-medium">{count}</span>}
                </Button>
              );
            })}
          </div>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-3 flex items-center text-slate-900 dark:text-white">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
              </h4>
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div key={reply.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author_avatar} alt={reply.author_name} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                          {reply.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">{reply.author_name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTimeAgo(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm ? (
            <form onSubmit={handleReplySubmit} className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
              <div>
                <Label htmlFor={`reply-author-${post.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your Name
                </Label>
                <Input
                  id={`reply-author-${post.id}`}
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <Label htmlFor={`reply-content-${post.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your Reply
                </Label>
                <Textarea
                  id={`reply-content-${post.id}`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="mt-1 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isSubmitting}
                  className="rounded-lg"
                >
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(true)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg"
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply to this discussion
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};