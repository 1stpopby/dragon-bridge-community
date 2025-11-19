import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageCircle, Heart, Send, Clock, User, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { ReportDialog } from "@/components/ReportDialog";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  category?: string;
  user_id?: string;
}

interface ForumReply {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  user_id?: string;
}

const ForumPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      setPost(postData);

      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      setReplies(repliesData || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load forum post.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !replyContent.trim() || !postId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_replies')
        .insert({
          post_id: postId,
          content: replyContent.trim(),
          author_name: profile.display_name,
          user_id: user.id
        });

      if (error) throw error;

      setReplyContent("");
      fetchPost(); // Refresh to get the new reply
      
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchPost();
    if (postId) {
      fetchReactions();
    }
  }, [postId]);

  const fetchReactions = async () => {
    if (!postId) return;

    try {
      const { data: reactions, error } = await supabase
        .from('forum_post_reactions')
        .select('*')
        .eq('post_id', postId);

      if (error) throw error;

      const likes = reactions?.filter(r => r.emoji === '👍').length || 0;
      const dislikes = reactions?.filter(r => r.emoji === '👎').length || 0;
      
      setLikeCount(likes);
      setDislikeCount(dislikes);

      if (user) {
        const userLike = reactions?.find(r => r.user_id === user.id && r.emoji === '👍');
        const userDislike = reactions?.find(r => r.user_id === user.id && r.emoji === '👎');
        
        if (userLike) setUserReaction('like');
        else if (userDislike) setUserReaction('dislike');
        else setUserReaction(null);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user || !profile || !postId) {
      toast({
        title: "Autentificare necesară",
        description: "Trebuie să fii autentificat pentru a reacționa",
        variant: "destructive",
      });
      return;
    }

    try {
      const emoji = type === 'like' ? '👍' : '👎';
      
      // Check if user already has this reaction
      if (userReaction === type) {
        // Remove reaction
        await supabase
          .from('forum_post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        // Remove any existing reaction first
        if (userReaction) {
          await supabase
            .from('forum_post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);
        }

        // Add new reaction
        await supabase
          .from('forum_post_reactions')
          .insert({
            post_id: postId,
            emoji: emoji,
            author_name: profile.display_name,
            user_id: user.id
          });
      }

      fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza reacția",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading forum post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Forum post not found.</p>
            <Button onClick={() => navigate('/forum')} className="mt-4">
              Back to Forum
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/forum')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>

            {/* Main Post */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium">{post.author_name}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                      {post.category && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary">{post.category}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Reactions and Report */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction('like')}
                    className={`gap-2 ${userReaction === 'like' ? 'text-primary bg-primary/10' : ''}`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-medium">{likeCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction('dislike')}
                    className={`gap-2 ${userReaction === 'dislike' ? 'text-destructive bg-destructive/10' : ''}`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="font-medium">{dislikeCount}</span>
                  </Button>

                  {user && user.id !== post.user_id && (
                    <ReportDialog
                      contentType="forum_post"
                      contentId={post.id}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
                        >
                          <Flag className="h-4 w-4" />
                          <span className="font-medium">Raportează</span>
                        </Button>
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reply Form */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Post a Reply</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReply} className="space-y-4">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        {isSubmitting ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Post Reply
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Replies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Replies ({replies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {replies.length > 0 ? (
                  <div className="space-y-6">
                    {replies.map((reply, index) => (
                      <div key={reply.id}>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                              {reply.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-sm">{reply.author_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </span>
                              {user && user.id !== reply.user_id && (
                                <ReportDialog
                                  contentType="forum_reply"
                                  contentId={reply.id}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-auto h-7 gap-1 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <Flag className="h-3 w-3" />
                                      <span className="text-xs">Raportează</span>
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                        {index < replies.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No replies yet. Be the first to comment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <AdvertisementBanner location="forum" variant="card" maxAds={1} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Author Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.author_name}</p>
                    <p className="text-sm text-muted-foreground">Forum Member</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;