import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ConversationMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'company';
  created_at: string;
  sender_name?: string;
}

interface ServiceConversationDialogProps {
  inquiry: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent?: () => void;
}

export function ServiceConversationDialog({ 
  inquiry, 
  open, 
  onOpenChange, 
  onMessageSent 
}: ServiceConversationDialogProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (open && inquiry) {
      loadConversation();
    }
  }, [open, inquiry]);

  const loadConversation = async () => {
    try {
      const conversationMessages: ConversationMessage[] = [];

      // Add the original inquiry as the first message
      conversationMessages.push({
        id: `original-${inquiry.id}`,
        message: inquiry.message,
        sender_type: 'user',
        created_at: inquiry.created_at,
        sender_name: inquiry.inquirer_name
      });

      // Add company responses if any
      if (inquiry.service_inquiry_responses && inquiry.service_inquiry_responses.length > 0) {
        inquiry.service_inquiry_responses.forEach((response: any) => {
          conversationMessages.push({
            id: `response-${response.id}`,
            message: response.response_message,
            sender_type: 'company',
            created_at: response.created_at,
            sender_name: response.profiles?.company_name || response.profiles?.display_name || 'Company'
          });
        });
      }

      // Add conversation messages
      if (inquiry.service_inquiry_conversations && inquiry.service_inquiry_conversations.length > 0) {
        inquiry.service_inquiry_conversations.forEach((conv: any) => {
          conversationMessages.push({
            id: conv.id,
            message: conv.message,
            sender_type: conv.sender_type,
            created_at: conv.created_at,
            sender_name: conv.sender_type === 'user' ? inquiry.inquirer_name : 'Company'
          });
        });
      }

      // Sort all messages by date
      conversationMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const isCompany = profile?.account_type === 'company';
      
      if (isCompany) {
        // Company sending message
        const { error } = await supabase
          .from('service_inquiry_conversations')
          .insert({
            inquiry_id: inquiry.id,
            sender_id: user?.id,
            sender_type: 'company',
            message: newMessage.trim()
          });

        if (error) throw error;
      } else {
        // User sending message
        const { error } = await supabase
          .from('service_inquiry_conversations')
          .insert({
            inquiry_id: inquiry.id,
            sender_id: user?.id,
            sender_type: 'user',
            message: newMessage.trim()
          });

        if (error) throw error;
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });

      setNewMessage("");
      await loadConversation(); // Reload conversation
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUserMessage = (message: ConversationMessage) => {
    return message.sender_type === 'user';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Service Conversation
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{inquiry.inquiry_type}</Badge>
            <span>•</span>
            <span>with {inquiry.inquirer_name}</span>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${isUserMessage(message) ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[70%] ${isUserMessage(message) ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      isUserMessage(message)
                        ? 'bg-muted border'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isUserMessage(message) ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Building2 className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {message.sender_name || (isUserMessage(message) ? 'User' : 'Company')}
                      </span>
                      <span className={`text-xs ${isUserMessage(message) ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSubmitting || !newMessage.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}