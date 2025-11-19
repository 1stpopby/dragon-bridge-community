import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, User, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";

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

const MessageConversation = () => {
  const { userId } = useParams<{ userId: string }>();
  const [conversation, setConversation] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchConversation();
      fetchPartnerProfile();

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
              (newMessage.sender_id === user?.id && newMessage.recipient_id === userId) ||
              (newMessage.sender_id === userId && newMessage.recipient_id === user?.id)
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
  }, [userId, user]);

  const fetchConversation = async () => {
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
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
        title: "Eroare la încărcarea conversației",
        description: "Te rugăm să încerci din nou mai târziu.",
        variant: "destructive",
      });
    }
  };

  const fetchPartnerProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setPartnerProfile(data);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !user || !userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: userId,
          subject: 'Re: ' + (conversation[0]?.subject || 'Mesaj'),
          content: replyContent,
          is_read: false,
        });

      if (error) throw error;

      setReplyContent('');
      toast({
        title: "Răspuns trimis cu succes",
        description: "Mesajul tău a fost trimis.",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Eroare la trimiterea răspunsului",
        description: "Te rugăm să încerci din nou mai târziu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-4 px-4">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/messages')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la mesaje
          </Button>
        </div>

        <Card className="border-border">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={partnerProfile?.avatar_url} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">
                  Conversație cu {partnerProfile?.display_name || 'Utilizator'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Vezi istoricul mesajelor și trimite răspunsuri
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-350px)] p-4">
            <div className="space-y-4">
              {conversation.map((message) => {
                const isFromMe = message.sender_id === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${isFromMe ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg p-4 ${
                          isFromMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">
                            {isFromMe ? 'Tu' : partnerProfile?.display_name || 'Utilizator'}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-4">
            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Răspunsul tău
                </label>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Scrie răspunsul tău aici..."
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/messages')}
                >
                  Închide
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !replyContent.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Trimite răspuns
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default MessageConversation;
