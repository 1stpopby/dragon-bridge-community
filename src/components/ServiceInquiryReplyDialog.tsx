import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
}

interface ServiceInquiryReplyDialogProps {
  inquiry: ServiceInquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplySent?: () => void;
}

export function ServiceInquiryReplyDialog({ 
  inquiry, 
  open, 
  onOpenChange, 
  onReplySent 
}: ServiceInquiryReplyDialogProps) {
  const [replyData, setReplyData] = useState({
    message: "",
    contactEmail: "",
    contactPhone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setReplyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyData.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_inquiry_responses')
        .insert({
          inquiry_id: inquiry.id,
          company_id: profile?.id,
          response_message: replyData.message,
          contact_email: replyData.contactEmail || profile?.contact_email,
          contact_phone: replyData.contactPhone || profile?.phone
        });

      if (error) throw error;

      toast({
        title: "Response sent successfully",
        description: "Your response has been sent to the customer",
      });

      // Reset form
      setReplyData({
        message: "",
        contactEmail: "",
        contactPhone: ""
      });

      onReplySent?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reply to Service Inquiry
          </DialogTitle>
          <DialogDescription>
            Respond to the inquiry from {inquiry.inquirer_name}
          </DialogDescription>
        </DialogHeader>

        {/* Original inquiry */}
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Original Inquiry:</h4>
            <p className="text-sm text-muted-foreground">
              <strong>From:</strong> {inquiry.inquirer_name} ({inquiry.inquirer_email})
            </p>
            <p className="text-sm mt-2">{inquiry.message}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Response *</Label>
              <Textarea
                id="message"
                placeholder="Type your response to the customer..."
                value={replyData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder={profile?.contact_email || "your@email.com"}
                  value={replyData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder={profile?.phone || "Your phone number"}
                  value={replyData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                />
              </div>
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
                {isSubmitting ? "Sending..." : "Send Response"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}