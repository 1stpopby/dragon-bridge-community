import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import CompanyLink from "@/components/CompanyLink";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit3, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

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
}

const PostCard = ({ post, onUpdate, onDelete }: PostCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

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

  const initials = post.author_name
    ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  const userInitials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author_avatar || undefined} alt={post.author_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CompanyLink 
                authorName={post.author_name} 
                userId={post.user_id}
                className="font-medium"
              />
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {user?.id === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
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

        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleEdit} size="sm">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-96 object-cover rounded-lg"
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-2 ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-4">
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
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[40px] resize-none"
                    disabled={isCommenting}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCommenting || !newComment.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {comments.map(comment => {
                const commentInitials = comment.author_name
                  ? comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : '?';

                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author_avatar || undefined} alt={comment.author_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {commentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <CompanyLink 
                          authorName={comment.author_name} 
                          userId={comment.user_id}
                          className="font-medium text-sm"
                          showBadge={false}
                        />
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;