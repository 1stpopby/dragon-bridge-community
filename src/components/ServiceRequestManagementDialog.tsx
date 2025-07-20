import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Building2,
  DollarSign,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ServiceFeedbackDialog } from "./ServiceFeedbackDialog";

interface ServiceRequestResponse {
  id: string;
  request_id: string;
  company_id: string;
  response_message: string;
  contact_email: string | null;
  contact_phone: string | null;
  estimated_cost: string | null;
  availability: string | null;
  response_status: string;
  created_at: string;
  company_name?: string;
  company_display_name?: string;
  company_location?: string;
  company_phone?: string;
  company_website?: string;
  company_verified?: boolean;
  feedback?: {
    id: string;
    rating: number;
    title: string;
    comment: string;
  } | null;
}

interface ServiceRequestManagementDialogProps {
  requestId: string;
  requestTitle: string;
  requestStatus: string;
  triggerButton: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ServiceRequestManagementDialog({ 
  requestId, 
  requestTitle, 
  requestStatus,
  triggerButton, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: ServiceRequestManagementDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [responses, setResponses] = useState<ServiceRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<ServiceRequestResponse | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (open && requestId) {
      fetchResponses();
    }
  }, [open, requestId]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      
      const { data: responsesData, error: responsesError } = await supabase
        .from('service_request_responses')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;

      const formattedResponses = await Promise.all(
        (responsesData || []).map(async (response) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, company_name, location, company_phone, company_website, is_verified')
            .eq('id', response.company_id)
            .single();

          const { data: feedbackData } = await supabase
            .from('service_feedback')
            .select('*')
            .eq('response_id', response.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...response,
            company_display_name: profileData?.display_name,
            company_name: profileData?.company_name,
            company_location: profileData?.location,
            company_phone: profileData?.company_phone,
            company_website: profileData?.company_website,
            company_verified: profileData?.is_verified,
            feedback: feedbackData || null
          };
        })
      );

      setResponses(formattedResponses);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast({
        title: "Error loading responses",
        description: "Failed to load service request responses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateResponseStatus = async (responseId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_request_responses')
        .update({ response_status: newStatus })
        .eq('id', responseId);

      if (error) throw error;

      await fetchResponses();
      
      toast({
        title: "Status updated",
        description: `Response status updated to ${newStatus}`,
      });

      // If accepting, update main request status
      if (newStatus === 'accepted') {
        await supabase
          .from('service_inquiries')
          .update({ status: 'accepted' })
          .eq('id', requestId);
      }
    } catch (error) {
      console.error('Error updating response status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const markAsCompleted = async (responseId: string) => {
    try {
      const response = responses.find(r => r.id === responseId);
      if (!response) return;

      await updateResponseStatus(responseId, 'completed');
      
      // Show feedback dialog
      setSelectedResponse(response);
      setShowFeedbackDialog(true);
      
      toast({
        title: "Service completed!",
        description: "Please leave feedback for the service provider.",
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  const sendMessage = async (responseId: string) => {
    const message = newMessage[responseId]?.trim();
    if (!message) return;

    try {
      const response = responses.find(r => r.id === responseId);
      if (!response) return;

      // Get the company's user_id from their profile
      const { data: companyProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', response.company_id)
        .single();

      if (profileError || !companyProfile) {
        throw new Error('Could not find company profile');
      }

      // Store the message in the dedicated messages table
      const { error: messageError } = await supabase
        .from('service_request_messages')
        .insert({
          request_id: requestId,
          response_id: responseId,
          sender_id: user?.id,
          recipient_id: companyProfile.user_id,
          message: message,
          message_type: 'user_to_company'
        });

      if (messageError) throw messageError;

      // Update local chat state for immediate feedback
      const currentMessages = chatMessages[responseId] || [];
      setChatMessages(prev => ({
        ...prev,
        [responseId]: [
          ...currentMessages,
          {
            id: Date.now(),
            message,
            sender: 'user',
            timestamp: new Date().toISOString(),
            author: profile?.display_name || 'You'
          }
        ]
      }));

      setNewMessage(prev => ({ ...prev, [responseId]: '' }));

      toast({
        title: "Message sent",
        description: "Your message has been sent to the service provider.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'accepted': return 'secondary';
      case 'declined': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Manage Service Request: "{requestTitle}"
            </DialogTitle>
            <DialogDescription>
              Communicate with service providers and manage your request status.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading responses...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No responses yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Companies will be notified about your request and their responses will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response) => (
                <Card key={response.id} className="border-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">
                            {response.company_name || response.company_display_name}
                          </CardTitle>
                          {response.company_location && (
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {response.company_location}
                            </p>
                          )}
                        </div>
                        {response.company_verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(response.response_status)} className="flex items-center gap-1">
                          {getStatusIcon(response.response_status)}
                          {response.response_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-line">{response.response_message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {response.contact_email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${response.contact_email}`}
                            className="text-primary hover:underline"
                          >
                            {response.contact_email}
                          </a>
                        </div>
                      )}
                      {(response.contact_phone || response.company_phone) && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`tel:${response.contact_phone || response.company_phone}`}
                            className="text-primary hover:underline"
                          >
                            {response.contact_phone || response.company_phone}
                          </a>
                        </div>
                      )}
                      {response.estimated_cost && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{response.estimated_cost}</span>
                        </div>
                      )}
                      {response.availability && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{response.availability}</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Section */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Communication
                      </h4>
                      
                      {/* Chat Messages */}
                      {chatMessages[response.id] && (
                        <div className="max-h-32 overflow-y-auto mb-3 space-y-2">
                          {chatMessages[response.id].map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`p-2 rounded-lg text-sm ${
                                msg.sender === 'user' 
                                  ? 'bg-primary text-primary-foreground ml-8' 
                                  : 'bg-muted mr-8'
                              }`}
                            >
                              <div className="font-medium text-xs opacity-70">{msg.author}</div>
                              <div>{msg.message}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Input */}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Ask for more details..."
                          value={newMessage[response.id] || ''}
                          onChange={(e) => setNewMessage(prev => ({
                            ...prev,
                            [response.id]: e.target.value
                          }))}
                          className="flex-1 min-h-[40px] resize-none"
                          rows={1}
                        />
                        <Button 
                          size="sm" 
                          onClick={() => sendMessage(response.id)}
                          disabled={!newMessage[response.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex gap-2">
                        {response.response_status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateResponseStatus(response.id, 'accepted')}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateResponseStatus(response.id, 'declined')}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </>
                        )}
                        {response.response_status === 'accepted' && (
                          <>
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              ACCEPTED
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => markAsCompleted(response.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Completed
                            </Button>
                          </>
                        )}
                        {response.response_status === 'completed' && response.feedback && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            Feedback Provided
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {response.company_website && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <a 
                              href={response.company_website.startsWith('http') ? response.company_website : `https://${response.company_website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Visit Website
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      {showFeedbackDialog && selectedResponse && (
        <ServiceFeedbackDialog
          response={selectedResponse}
          triggerButton={<Button>Leave Feedback</Button>}
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          onFeedbackSubmitted={() => {
            setShowFeedbackDialog(false);
            fetchResponses();
          }}
        />
      )}
    </>
  );
}