import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationPartnerId: string;
  initialMessage: Message;
}

export function MessageDialog({ open, onOpenChange, conversationPartnerId, initialMessage }: MessageDialogProps) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [replySubject, setReplySubject] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (open && conversationPartnerId) {
      fetchConversation();
      fetchPartnerProfile();
      setReplySubject(`Re: ${initialMessage.subject}`);

      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('message-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMessage = payload.new as Message;
            // Only add if it's part of this conversation
            if (
              (newMessage.sender_id === user?.id && newMessage.recipient_id === conversationPartnerId) ||
              (newMessage.sender_id === conversationPartnerId && newMessage.recipient_id === user?.id)
            ) {
              setConversation(prev => [...prev, newMessage]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, conversationPartnerId, initialMessage, user]);

  const fetchConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationPartnerId}),and(sender_id.eq.${conversationPartnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversation(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.is_read
      ).map(msg => msg.id) || [];

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error loading conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const fetchPartnerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', conversationPartnerId)
        .single();

      if (error) throw error;
      setPartnerProfile(data);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim() || !replySubject.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: conversationPartnerId,
          subject: replySubject,
          content: replyContent,
        });

      if (error) throw error;

      toast({
        title: "Reply sent!",
        description: "Your message has been delivered.",
      });

      setReplyContent('');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error sending reply",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={partnerProfile?.avatar_url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            Conversation with {partnerProfile?.display_name || 'User'}
          </DialogTitle>
          <DialogDescription>
            View message history and send replies
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Conversation History */}
          <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
            <div className="space-y-4">
              {conversation.map((message) => {
                const isFromCurrentUser = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card className={`max-w-[80%] p-3 ${
                      isFromCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={
                            isFromCurrentUser 
                              ? profile?.avatar_url 
                              : partnerProfile?.avatar_url
                          } />
                          <AvatarFallback className="text-xs">
                            {isFromCurrentUser 
                              ? profile?.display_name?.[0] 
                              : partnerProfile?.display_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {isFromCurrentUser 
                            ? 'You' 
                            : partnerProfile?.display_name || 'User'}
                        </span>
                        <span className={`text-xs ${
                          isFromCurrentUser 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </Card>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="space-y-3">
            <div>
              <Label htmlFor="reply-subject">Subject</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Message subject"
                required
              />
            </div>
            <div>
              <Label htmlFor="reply-content">Your Reply</Label>
              <Textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button type="submit" disabled={loading || !replyContent.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}