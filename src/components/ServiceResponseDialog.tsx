import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Building2,
  User,
  Calendar,
  Reply
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ServiceResponseReplyDialog } from "./ServiceResponseReplyDialog";
import { useAuth } from "@/hooks/useAuth";

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

interface ServiceResponseDialogProps {
  response: ServiceInquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplySent?: () => void;
}

export function ServiceResponseDialog({ response, open, onOpenChange, onReplySent }: ServiceResponseDialogProps) {
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const { profile } = useAuth();
  const parseResponseMessage = (message: string) => {
    if (message.includes('Response to your service request:')) {
      const parts = message.split('Response to your service request:');
      if (parts.length > 1) {
        const content = parts[1].split('Contact Information:')[0]?.trim();
        const contactInfo = parts[1].split('Contact Information:')[1]?.trim();
        
        // Extract company info
        const companyMatch = content.match(/Company: ([^\\n]+)/);
        const fromMatch = content.match(/From: ([^\\n]+)/);
        const originalRequestIdMatch = message.match(/Original Request ID: ([a-f0-9-]+)/);
        
        return { 
          content: content.replace(/Company: [^\\n]+/g, '').replace(/From: [^\\n]+/g, '').trim(), 
          contactInfo,
          company: companyMatch ? companyMatch[1] : null,
          from: fromMatch ? fromMatch[1] : null,
          originalRequestId: originalRequestIdMatch ? originalRequestIdMatch[1] : null
        };
      }
    }
    return { content: message, contactInfo: null, company: null, from: null, originalRequestId: null };
  };

  const { content, contactInfo, company, from, originalRequestId } = parseResponseMessage(response.message);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Service Response Details
          </DialogTitle>
          <DialogDescription>
            Response from {from || response.inquirer_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Response Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {from || response.inquirer_name}
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                </Badge>
              </CardTitle>
              {company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {company}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Response Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Response Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-line leading-relaxed">{content}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {contactInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Email:</span>
                    <span>{response.inquirer_email}</span>
                  </div>
                  {response.inquirer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Phone:</span>
                      <span>{response.inquirer_phone}</span>
                    </div>
                  )}
                  {contactInfo.split('\\n').map((line, index) => (
                    <p key={index} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reference Information */}
          {originalRequestId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Reference Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Original Request ID:</span> {originalRequestId}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Response ID:</span> {response.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4">
          {/* Only show reply button for companies */}
          {profile?.account_type === 'company' && (
            <Button 
              onClick={() => setReplyDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Reply className="h-4 w-4" />
              Reply to Message
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className={profile?.account_type === 'company' ? '' : 'ml-auto'}
          >
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Reply Dialog */}
      <ServiceResponseReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        originalResponse={response}
        onReplySent={() => {
          setReplyDialogOpen(false);
          onReplySent?.();
        }}
      />
    </Dialog>
  );
}