import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Clock, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

interface ForumReply {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
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
  const { toast } = useToast();

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
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
          <p className="text-muted-foreground mb-3">{post.content}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>by {post.author_name}</span>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="border-t pt-4 mb-4">
            <h4 className="font-medium mb-3 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h4>
            <div className="space-y-3">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm mb-2">{reply.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {reply.author_name}</span>
                    <span>{formatTimeAgo(reply.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm ? (
          <form onSubmit={handleReplySubmit} className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`reply-author-${post.id}`} className="text-sm">Your Name</Label>
                <Input
                  id={`reply-author-${post.id}`}
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`reply-content-${post.id}`} className="text-sm">Your Reply</Label>
              <Textarea
                id={`reply-content-${post.id}`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyForm(true)}
            >
              <Reply className="h-4 w-4 mr-2" />
              Reply to this post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};