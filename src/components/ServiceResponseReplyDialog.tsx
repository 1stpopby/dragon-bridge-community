import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, User, Send } from 'lucide-react';

interface ServiceInquiry {
  id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string;
  message: string;
  inquiry_type: string;
  created_at: string;
  service_id: string;
  user_id?: string;
}

interface ServiceResponseReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalResponse: ServiceInquiry;
  onReplySent: () => void;
}

export const ServiceResponseReplyDialog: React.FC<ServiceResponseReplyDialogProps> = ({
  open,
  onOpenChange,
  originalResponse,
  onReplySent
}) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [latestUserMessage, setLatestUserMessage] = useState<any>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Pre-fill contact information and fetch latest user message when dialog opens
  useEffect(() => {
    if (open && profile) {
      setContactEmail(profile.contact_email || user?.email || '');
      setContactPhone(profile.phone || profile.company_phone || '');
      
      // Fetch the latest user message for this conversation
      const fetchLatestUserMessage = async () => {
        try {
          const originalRequestId = extractOriginalRequestId(originalResponse.message);
          const requestId = originalRequestId || originalResponse.id;

          const { data: latestMessage } = await supabase
            .from('service_request_messages')
            .select('*')
            .eq('request_id', requestId)
            .eq('message_type', 'user_to_company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestMessage) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('display_name, contact_email')
              .eq('user_id', latestMessage.sender_id)
              .single();

            setLatestUserMessage({
              ...latestMessage,
              inquirer_name: senderProfile?.display_name || 'User',
              inquirer_email: senderProfile?.contact_email || '',
            });
          }
        } catch (error) {
          console.error('Error fetching latest user message:', error);
        }
      };

      fetchLatestUserMessage();
    }
  }, [open, profile, user, originalResponse]);

  const extractOriginalRequestId = (message: string) => {
    const match = message.match(/Original Request ID: ([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const extractSenderId = (message: string) => {
    const match = message.match(/Sender ID: ([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const parseResponseMessage = (message: string) => {
    if (message.includes('Response to your service request:')) {
      const parts = message.split('Response to your service request:');
      if (parts.length > 1) {
        const content = parts[1].split('Contact Information:')[0]?.trim();
        return content;
      }
    }
    return message;
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a reply message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const originalRequestId = extractOriginalRequestId(originalResponse.message);
      const senderId = extractSenderId(originalResponse.message);
      
      // Determine who should receive this reply
      // If we have the sender ID from the message, use it to determine the conversation flow
      let recipientId: string;
      
      if (senderId && senderId !== user?.id) {
        // Send reply to the original sender of the message
        recipientId = senderId;
      } else {
        // Fallback: send to the user_id of the original response
        recipientId = originalResponse.user_id || user?.id || '';
      }

      const replyMessageContent = `Reply to service conversation:

${replyMessage}

Contact Information:
Email: ${contactEmail}
Phone: ${contactPhone || 'Not provided'}

${profile?.company_name ? `Company: ${profile.company_name}` : ''}
${profile?.display_name ? `From: ${profile.display_name}` : ''}

${originalRequestId ? `Original Request ID: ${originalRequestId}` : ''}
Conversation ID: ${originalResponse.id}
Sender ID: ${user?.id}`;

      const { error } = await supabase
        .from('service_request_messages')
        .insert({
          request_id: originalRequestId || originalResponse.id,
          sender_id: user?.id,
          recipient_id: recipientId,
          message: replyMessage,
          message_type: 'company_to_user'
        });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      toast({
        title: "Reply sent!",
        description: "Your reply has been sent successfully.",
      });

      // Reset form and close dialog
      setReplyMessage('');
      onOpenChange(false);
      onReplySent();
      
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      toast({
        title: "Error sending reply",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setReplyMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Reply to Service Response
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Latest User Message Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {latestUserMessage 
                  ? `Latest message from ${latestUserMessage.inquirer_name}`
                  : `Original Response from ${originalResponse.inquirer_name}`
                }
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {latestUserMessage 
                ? latestUserMessage.message
                : parseResponseMessage(originalResponse.message)
              }
            </p>
            {latestUserMessage && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(latestUserMessage.created_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Reply Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply-message">Your Reply</Label>
              <Textarea
                id="reply-message"
                placeholder="Type your reply message here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-email">Your Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">Your Phone (Optional)</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+44 123 456 7890"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={sending || !replyMessage.trim()}
            >
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 