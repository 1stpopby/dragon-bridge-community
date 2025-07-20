import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ServiceInquiry {
  id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string;
  message: string;
  inquiry_type: string;
  created_at: string;
  service_id: string;
  service_inquiry_responses?: any[];
}

interface UserReplyDialogProps {
  inquiry: ServiceInquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplySent?: () => void;
}

export function UserReplyDialog({ 
  inquiry, 
  open, 
  onOpenChange, 
  onReplySent 
}: UserReplyDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_inquiry_conversations')
        .insert({
          inquiry_id: inquiry.id,
          sender_id: user?.id,
          sender_type: 'user',
          message: message.trim()
        });

      if (error) throw error;

      toast({
        title: "Message sent successfully",
        description: "Your reply has been sent to the company",
      });

      // Reset form
      setMessage("");
      onReplySent?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestResponse = inquiry.service_inquiry_responses?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reply to Company Response
          </DialogTitle>
          <DialogDescription>
            Continue your conversation with the company
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Original inquiry */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Your Original Message:</p>
            <p className="text-sm">{inquiry.message}</p>
          </div>

          {/* Latest company response */}
          {latestResponse && (
            <div className="bg-green-50 p-3 rounded border border-green-200 dark:bg-green-950 dark:border-green-800">
              <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Company Response:</p>
              <p className="text-sm">{latestResponse.response_message}</p>
              {(latestResponse.contact_email || latestResponse.contact_phone) && (
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Contact Details:</p>
                  {latestResponse.contact_email && (
                    <p className="text-xs text-muted-foreground">Email: {latestResponse.contact_email}</p>
                  )}
                  {latestResponse.contact_phone && (
                    <p className="text-xs text-muted-foreground">Phone: {latestResponse.contact_phone}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-message">Your Reply</Label>
              <Textarea
                id="reply-message"
                placeholder="Type your reply to the company..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}