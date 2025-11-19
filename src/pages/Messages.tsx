import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import { MessageDialog } from "@/components/MessageDialog";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  latest_message: Message;
  unread_count: number;
  messages: Message[];
}

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();

      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.new.recipient_id === user.id) {
            fetchMessages();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      
      // Group messages by conversation
      if (data) {
        await groupMessagesIntoConversations(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const groupMessagesIntoConversations = async (allMessages: Message[]) => {
    const conversationMap = new Map<string, Message[]>();
    
    // Group messages by the other user (not current user)
    allMessages.forEach(message => {
      const otherUserId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, []);
      }
      conversationMap.get(otherUserId)!.push(message);
    });

    // Fetch user details for each conversation and create conversation objects
    const conversationsPromises = Array.from(conversationMap.entries()).map(async ([otherUserId, msgs]) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', otherUserId)
        .single();

      // Sort messages by date (most recent first)
      const sortedMsgs = msgs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Count unread messages (messages sent to current user that are unread)
      const unreadCount = msgs.filter(m => 
        m.recipient_id === user?.id && !m.is_read
      ).length;

      return {
        other_user_id: otherUserId,
        other_user_name: profile?.display_name || 'Unknown User',
        latest_message: sortedMsgs[0],
        unread_count: unreadCount,
        messages: sortedMsgs
      };
    });

    const conversationsList = await Promise.all(conversationsPromises);
    
    // Sort conversations by latest message date
    conversationsList.sort((a, b) => 
      new Date(b.latest_message.created_at).getTime() - new Date(a.latest_message.created_at).getTime()
    );
    
    setConversations(conversationsList);
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessageDialogOpen(true);
  };

  const handleMessageDialogClose = () => {
    setMessageDialogOpen(false);
    setSelectedConversation(null);
    // Refresh messages to update read status
    fetchMessages();
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mesaje</h1>
            <p className="text-muted-foreground">Mesajele tale private de la alți membri ai comunității</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mesaje Private
            </CardTitle>
            <CardDescription>
              Mesaje directe de la alți membri ai comunității
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Încă nu ai mesaje</p>
                  <p className="text-sm">Când cineva îți trimite un mesaj direct, va apărea aici</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conversation) => {
                    const isUnread = conversation.unread_count > 0;
                    const latestMsg = conversation.latest_message;
                    const isFromMe = latestMsg.sender_id === user?.id;
                    
                    return (
                      <div
                        key={conversation.other_user_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          isUnread ? 'bg-primary/5 border-primary/20' : 'bg-background'
                        }`}
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Mesaj Privat</span>
                            {isUnread && (
                              <Badge variant="default" className="text-xs">
                                {conversation.unread_count} {conversation.unread_count === 1 ? 'nou' : 'noi'}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(latestMsg.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h4 className="font-medium mb-2">
                          {isFromMe ? 'Reply from' : 'Message from'} {conversation.other_user_name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {isFromMe && <span className="text-foreground font-medium">You: </span>}
                          {latestMsg.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Dialog */}
        {selectedConversation && (
          <MessageDialog
            open={messageDialogOpen}
            onOpenChange={handleMessageDialogClose}
            conversationPartnerId={selectedConversation.other_user_id}
            initialMessage={selectedConversation.latest_message}
          />
        )}
      </div>
      <MobileNavigation />
    </div>
  );
};

export default Messages;