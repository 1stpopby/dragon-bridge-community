import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientId?: string;
  subject?: string;
  prefilledMessage?: string;
}

export function SendMessageDialog({ 
  open, 
  onOpenChange, 
  recipientName, 
  recipientId,
  subject = "",
  prefilledMessage = ""
}: SendMessageDialogProps) {
  const [messageContent, setMessageContent] = useState(prefilledMessage);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (!user || !recipientId) {
      toast({
        title: "Unable to send message",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: recipientId,
          subject: `Message from ${user.email?.split('@')[0] || 'User'}`,
          content: messageContent
        }]);

      if (messageError) throw messageError;

      // Create notification for recipient
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: recipientId,
          type: 'message',
          title: `New message from ${user.email}`,
          content: `New message received`,
          related_type: 'message'
        }]);

      if (notificationError) console.error('Notification error:', notificationError);

      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${recipientName}.`,
      });

      setMessageContent("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-content">Message</Label>
            <Textarea
              id="message-content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={`Write your message to ${recipientName}...`}
              rows={8}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}