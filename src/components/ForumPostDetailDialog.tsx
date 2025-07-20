import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, Reply, Heart, ThumbsUp, Smile, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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

interface ForumReply {
  id: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  user_id?: string;
}

interface Reaction {
  id: string;
  emoji: string;
  author_name: string;
  user_id: string | null;
}

interface ForumPostDetailDialogProps {
  post: ForumPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplyAdded?: () => void;
}

export const ForumPostDetailDialog = ({ post, open, onOpenChange, onReplyAdded }: ForumPostDetailDialogProps) => {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Set the reply author name based on the current user
  useEffect(() => {
    if (user && profile) {
      const userName = profile.display_name || user.email?.split('@')[0] || 'Anonymous';
      setReplyAuthor(userName);
    }
  }, [user, profile]);

  const availableEmojis = [
    { emoji: "👍", name: "like" },
    { emoji: "❤️", name: "love" },
    { emoji: "😂", name: "laugh" },
    { emoji: "😮", name: "wow" },
    { emoji: "😢", name: "sad" },
    { emoji: "⭐", name: "star" }
  ];

  useEffect(() => {
    if (post && open) {
      fetchReplies();
      fetchReactions();
    }
  }, [post, open]);

  const fetchReplies = async () => {
    if (!post) return;
    
    setLoading(true);
    try {
      const { data: repliesData, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (repliesData && repliesData.length > 0) {
        // Get unique user IDs from replies
        const userIds = [...new Set(repliesData.map(reply => reply.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          // Fetch profiles for these users
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, avatar_url')
            .in('user_id', userIds);
          
          // Create a map of user_id to avatar_url
          const avatarMap = new Map();
          profilesData?.forEach(profile => {
            avatarMap.set(profile.user_id, profile.avatar_url);
          });
          
          // Map the replies to include the avatar_url
          const mappedReplies = repliesData.map(reply => ({
            ...reply,
            author_avatar: reply.user_id ? avatarMap.get(reply.user_id) || null : null
          }));
          
          setReplies(mappedReplies);
        } else {
          setReplies(repliesData);
        }
      } else {
        setReplies(repliesData || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReactions = async () => {
    if (!post) return;
    
    try {
      const { data: reactionsData, error } = await supabase
        .from('forum_post_reactions')
        .select('*')
        .eq('post_id', post.id);

      if (error) throw error;
      setReactions(reactionsData || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!post || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to react to posts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user has already reacted with this emoji
      const existingReaction = reactions.find(r => r.emoji === emoji && r.user_id === user.id);

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
            emoji: emoji,
            author_name: profile?.display_name || user.email?.split('@')[0] || 'Anonymous',
            user_id: user.id
          });

        if (error) throw error;
      }

      // Refresh reactions
      fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };

  const getReactionCount = (emoji: string) => {
    return reactions.filter(r => r.emoji === emoji).length;
  };

  const hasUserReacted = (emoji: string) => {
    return user ? reactions.some(r => r.emoji === emoji && r.user_id === user.id) : false;
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

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !replyContent.trim() || !replyAuthor.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_replies')
        .insert({
          post_id: post.id,
          content: replyContent.trim(),
          author_name: replyAuthor.trim(),
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your reply has been posted!",
      });

      setReplyContent("");
      setReplyAuthor("");
      setShowReplyForm(false);
      fetchReplies();
      onReplyAdded?.();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{post.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Post Content */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
            <div className="flex items-start space-x-4 mb-4">
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => post.user_id && navigate(`/user/${post.user_id}`)}
              >
                <Avatar className="h-12 w-12 ring-2 ring-slate-100 dark:ring-slate-700">
                  <AvatarImage src={post.author_avatar} alt={post.author_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                    {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span 
                    className="font-medium text-slate-900 dark:text-white hover:text-primary cursor-pointer transition-colors"
                    onClick={() => post.user_id && navigate(`/user/${post.user_id}`)}
                  >
                    {post.author_name}
                  </span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(post.created_at)}</span>
                  </div>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Emoji Reactions */}
            <div className="flex flex-wrap items-center gap-2">
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
          </div>

          {/* Replies Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center text-slate-900 dark:text-white">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="rounded-lg"
              >
                <Reply className="h-4 w-4 mr-2" />
                {showReplyForm ? 'Cancel' : 'Reply'}
              </Button>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <form onSubmit={handleReplySubmit} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <Label htmlFor="reply-author" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Your Name
                  </Label>
                  <Input
                    id="reply-author"
                    value={replyAuthor}
                    disabled
                    placeholder="Enter your name"
                    className="mt-1 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reply-content" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Your Reply
                  </Label>
                  <Textarea
                    id="reply-content"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className="mt-1 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="flex justify-end">
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
            )}

            {/* Replies List */}
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading replies...</div>
            ) : replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => reply.user_id && navigate(`/user/${reply.user_id}`)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={reply.author_avatar} alt={reply.author_name} />
                          <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {reply.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span 
                            className="font-medium text-slate-900 dark:text-white hover:text-primary cursor-pointer transition-colors"
                            onClick={() => reply.user_id && navigate(`/user/${reply.user_id}`)}
                          >
                            {reply.author_name}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {formatTimeAgo(reply.created_at)}
                          </span>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No replies yet. Be the first to reply!
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 