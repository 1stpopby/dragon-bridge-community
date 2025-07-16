import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  Eye,
  ThumbsUp,
  MessageCircle
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
    would_recommend: boolean;
    service_quality_rating: number | null;
    communication_rating: number | null;
    timeliness_rating: number | null;
    value_rating: number | null;
    created_at: string;
  } | null;
}

interface ServiceRequestResponsesDialogProps {
  requestId: string;
  requestTitle: string;
  triggerButton: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ServiceRequestResponsesDialog({ 
  requestId, 
  requestTitle, 
  triggerButton, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: ServiceRequestResponsesDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [responses, setResponses] = useState<ServiceRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && requestId) {
      fetchResponses();

      // Set up real-time subscription for response updates
      const channel = supabase
        .channel('response-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_request_responses',
            filter: `request_id=eq.${requestId}`,
          },
          () => {
            console.log('New response received, refreshing responses...');
            fetchResponses();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'service_request_responses',
            filter: `request_id=eq.${requestId}`,
          },
          (payload) => {
            console.log('Response updated, updating local state...', payload);
            
            // Update local state directly instead of refetching
            if (payload.new && payload.new.id) {
              setResponses(prevResponses => 
                prevResponses.map(response => 
                  response.id === payload.new.id 
                    ? { ...response, ...payload.new }
                    : response
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, requestId]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      
      // First fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('service_request_responses')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;

      // Then fetch company profiles and feedback for each response
      const formattedResponses = await Promise.all(
        (responsesData || []).map(async (response) => {
          // Get company profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, company_name, location, company_phone, company_website, is_verified')
            .eq('id', response.company_id)
            .single();

          // Get feedback for this response
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
      // Update the response status - database trigger will automatically update main service request
      const { error } = await supabase
        .from('service_request_responses')
        .update({ 
          response_status: newStatus
        })
        .eq('id', responseId);

      if (error) {
        console.error('Error updating response status:', error);
        return;
      }

      // Refresh the responses to show updated status
      await fetchResponses();
      
      console.log(`Response ${responseId} status updated to: ${newStatus}`);
      
      // If marking as completed, show success message
      if (newStatus === 'completed') {
        console.log(`Service request ${requestId} automatically marked as completed via database trigger`);
      }
    } catch (error) {
      console.error('Error updating response status:', error);
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
      case 'declined': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Responses to "{requestTitle}"
          </DialogTitle>
          <DialogDescription>
            Companies that have responded to your service request.
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
          <div className="space-y-4">
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
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                      </span>
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

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {response.response_status === 'completed' ? 'Status:' : 'Update status:'}
                      </span>
                      {response.response_status === 'completed' ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Select 
                          value={response.response_status} 
                          onValueChange={(value) => updateResponseStatus(response.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <Eye className="h-4 w-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={`mailto:${response.contact_email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Feedback Section - Only show when status is completed */}
                  {response.response_status === 'completed' && (
                    response.feedback ? (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-900">Your Feedback</h4>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${
                                  star <= response.feedback!.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                            <span className="ml-1 text-sm text-blue-700">
                              {response.feedback.rating}/5
                            </span>
                          </div>
                        </div>
                        <p className="font-medium text-blue-900 mb-1">{response.feedback.title}</p>
                        <p className="text-sm text-blue-700 mb-2">{response.feedback.comment}</p>
                        <div className="flex items-center gap-4 text-xs text-blue-600">
                          {response.feedback.would_recommend && (
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span>Would recommend</span>
                            </div>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(response.feedback.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Service Completed!</h4>
                            <p className="text-sm text-green-700">
                              How was your experience? Your feedback helps other users.
                            </p>
                          </div>
                          <ServiceFeedbackDialog
                            response={response}
                            triggerButton={
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Leave Feedback
                              </Button>
                            }
                            onFeedbackSubmitted={() => fetchResponses()}
                          />
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 