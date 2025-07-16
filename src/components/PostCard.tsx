import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import CompanyLink from "@/components/CompanyLink";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit3, Send, Share2, Bookmark, Eye } from "lucide-react";
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
}

const PostCard = ({ post, onUpdate, onDelete, onSave, isSaved = false }: PostCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [likeAnimation, setLikeAnimation] = useState(false);

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

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) throw error;
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 300);
      }
    } catch (error) {
      console.error('Error updating like:', error);
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
      fetchComments();
      
      // Update comments count
      onUpdate({
        ...post,
        comments_count: post.comments_count + 1
      });
    } catch (error) {
      console.error('Error adding comment:', error);
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
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CompanyLink 
                    authorName={post.author_name} 
                    userId={post.user_id}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  />
                  {isRecent && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">Public</span>
                  </div>
                </div>
              </div>
            </div>
            
            {user?.id === post.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                <span className="font-medium">{post.comments_count}</span>
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