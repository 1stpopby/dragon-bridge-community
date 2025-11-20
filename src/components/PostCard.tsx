import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import CompanyLink from "@/components/CompanyLink";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit3, Send, Share2, Bookmark, Globe, Lock, UserPlus, UserCheck, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ReportDialog } from "@/components/ReportDialog";

interface Comment {
  id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked?: boolean;
}

interface PostCardProps {
  post: Post;
  onUpdate: (post: Post) => void;
  onDelete: (postId: string) => void;
  onSave?: (post: Post) => void;
  isSaved?: boolean;
  onFollow?: (userId: string) => void;
}

const PostCard = ({ post, onUpdate, onDelete, onSave, isSaved = false, onFollow }: PostCardProps) => {
  const { user, profile } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Sync state when post prop changes
  useEffect(() => {
    setIsLiked(post.user_liked || false);
    setLikesCount(post.likes_count || 0);
    setCommentsCount(post.comments_count || 0);
  }, [post.user_liked, post.likes_count, post.comments_count]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !profile || user.id === post.user_id) return;
    
    try {
      // Get the post author's profile first
      const { data: authorProfile, error: authorError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', post.user_id)
        .single();

      if (authorError || !authorProfile) return;

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', profile.id)
        .eq('following_id', authorProfile.id)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile || user.id === post.user_id) return;
    
    setFollowLoading(true);
    try {
      // Get the post author's profile first
      const { data: authorProfile, error: authorError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', post.user_id)
        .single();

      if (authorError || !authorProfile) {
        throw new Error('Could not find user profile');
      }

      // Validate IDs before proceeding
      if (!profile.id || !authorProfile.id) {
        throw new Error('Invalid profile data');
      }

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', profile.id)
          .eq('following_id', authorProfile.id);

        if (error) throw error;
        setIsFollowing(false);
        toast({
          title: "User unfollowed",
          description: `You are no longer following ${post.author_name}.`,
        });
      } else {
        // Check if already following to prevent duplicate key error
        const { data: existingFollow } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', profile.id)
          .eq('following_id', authorProfile.id)
          .maybeSingle();

        if (existingFollow) {
          // Already following, just update the UI
          setIsFollowing(true);
          toast({
            title: "Already following",
            description: `You are already following ${post.author_name}.`,
          });
        } else {
          // Follow
          const { error } = await supabase
            .from('user_follows')
            .insert({
              follower_id: profile.id,
              following_id: authorProfile.id
            });

          if (error) {
            // Handle duplicate key error specifically
            if (error.code === '23505') {
              setIsFollowing(true);
              toast({
                title: "Already following",
                description: `You are already following ${post.author_name}.`,
              });
            } else {
              throw error;
            }
          } else {
            setIsFollowing(true);
            toast({
              title: "User followed",
              description: `You are now following ${post.author_name}!`,
            });
          }
        }
      }

      // Call the parent onFollow callback if provided
      if (onFollow) {
        onFollow(authorProfile.id);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id]);

  useEffect(() => {
    checkFollowStatus();
  }, [user, profile, post.user_id]);

  const handleLike = async () => {
    if (!user) return;

    // Optimistic update
    const wasLiked = isLiked;
    const previousCount = likesCount;
    
    try {
      if (wasLiked) {
        // Optimistic update for unlike
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1)); // Prevent negative counts
        
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Optimistic update for like
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 300);
        
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) {
          // Handle duplicate key error (user already liked)
          if (error.code === '23505') {
            // Already liked, just update UI
            setIsLiked(true);
            return;
          }
          throw error;
        }
      }

      // Fetch updated post data to sync with database triggers
      setTimeout(async () => {
        try {
          const { data: updatedPost, error: fetchError } = await supabase
            .from('posts')
            .select('likes_count')
            .eq('id', post.id)
            .single();

          if (!fetchError && updatedPost) {
            setLikesCount(updatedPost.likes_count);
            // Update parent component with new data
            onUpdate({
              ...post,
              likes_count: updatedPost.likes_count,
              user_liked: !wasLiked
            });
          }
        } catch (syncError) {
          console.error('Error syncing like count:', syncError);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error updating like:', error);
      
      // Revert optimistic updates on error
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsCommenting(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          author_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown User',
          author_avatar: profile?.avatar_url,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      
      // Refresh comments immediately
      fetchComments();
      
      // Update local count immediately
      setCommentsCount(prev => prev + 1);
      
      // Fetch updated comments count from database after trigger has run
      setTimeout(async () => {
        try {
          const { data: updatedPost, error: fetchError } = await supabase
            .from('posts')
            .select('comments_count')
            .eq('id', post.id)
            .single();

          if (!fetchError && updatedPost) {
            setCommentsCount(updatedPost.comments_count);
            // Update parent component with new data
            onUpdate({
              ...post,
              comments_count: updatedPost.comments_count
            });
          }
        } catch (syncError) {
          console.error('Error syncing comment count:', syncError);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      // Revert optimistic update on error
      setCommentsCount(prev => Math.max(0, prev - 1));
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent.trim() })
        .eq('id', post.id);

      if (error) throw error;

      onUpdate({
        ...post,
        content: editContent.trim()
      });

      setIsEditing(false);
      
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      onDelete(post.id);
      
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author_name}`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard.",
      });
    }
  };

  const initials = post.author_name
    ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  const userInitials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const isRecent = new Date(post.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm overflow-hidden group">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/user/${post.user_id}`)}
              >
                <Avatar className="h-12 w-12 ring-2 ring-primary/10 transition-all group-hover:ring-primary/20">
                  <AvatarImage src={post.author_avatar || undefined} alt={post.author_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/user/${post.user_id}`)}
                  >
                    {post.author_name}
                  </span>
                  {isRecent && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span className="text-xs">Public</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              {/* Follow button - only show if not the current user and user is logged in */}
              {user && user.id !== post.user_id && (
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="gap-2 transition-all"
                >
                  {followLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  ) : isFollowing ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {isFollowing ? 'Following' : 'Follow'}
                  </span>
                </Button>
              )}
              
              {/* Edit/Delete dropdown - show for post owner or admin */}
              {(user?.id === post.user_id || isAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editează
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Șterge
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6">
          {isEditing ? (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none border-0 bg-background/50"
                placeholder="Share your thoughts..."
              />
              <div className="flex gap-2">
                <Button onClick={handleEdit} size="sm" className="gap-2">
                  <Send className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {post.content}
              </p>
              
              {post.image_url && (
                <div className="rounded-xl overflow-hidden bg-muted/20">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-96 object-cover transition-transform hover:scale-105 duration-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="px-6 py-4 mt-4">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`gap-2 transition-all duration-200 ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'hover:text-red-500 hover:bg-red-50'
                } ${likeAnimation ? 'scale-110' : ''}`}
              >
                <Heart className={`h-4 w-4 transition-all ${isLiked ? 'fill-current scale-110' : ''}`} />
                <span className="font-medium">{likesCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">{commentsCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2 hover:text-green-500 hover:bg-green-50 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Share</span>
              </Button>

              {user && user.id !== post.user_id && (
                <ReportDialog
                  contentType="post"
                  contentId={post.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Flag className="h-4 w-4" />
                      <span className="font-medium">Raportează</span>
                    </Button>
                  }
                />
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSave?.(post)}
              className={`transition-all ${
                isSaved 
                  ? 'text-yellow-600 hover:text-yellow-700' 
                  : 'hover:text-yellow-600'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t bg-muted/10">
            <div className="p-6 space-y-4">
              {/* Add Comment */}
              {user && (
                <form onSubmit={handleComment} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="Your avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Write a thoughtful comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[40px] resize-none bg-background/80 border-0 focus-visible:ring-1"
                      disabled={isCommenting}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isCommenting || !newComment.trim()}
                      className="self-end"
                    >
                      {isCommenting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-4">
                  {comments.map(comment => {
                    const commentInitials = comment.author_name
                      ? comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : '?';

                    return (
                      <div key={comment.id} className="flex gap-3 group/comment">
                        <div 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/user/${comment.user_id}`)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author_avatar || undefined} alt={comment.author_name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {commentInitials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="bg-muted/50 rounded-lg p-3 transition-colors group-hover/comment:bg-muted/70">
                            <CompanyLink 
                              authorName={comment.author_name} 
                              userId={comment.user_id}
                              className="font-medium text-sm"
                              showBadge={false}
                            />
                            <p className="text-sm whitespace-pre-wrap mt-1 text-foreground/90">
                              {comment.content}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground pl-3">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {comments.length === 0 && (
                <div className="text-center py-6">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;