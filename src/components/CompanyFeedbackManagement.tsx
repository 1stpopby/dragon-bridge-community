import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Building2, 
  User, 
  MessageSquare, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ServiceFeedback {
  id: string;
  response_id: string;
  request_id: string;
  user_id: string;
  company_id: string;
  rating: number;
  title: string;
  comment: string;
  would_recommend: boolean;
  service_quality_rating?: number;
  communication_rating?: number;
  timeliness_rating?: number;
  value_rating?: number;
  created_at: string;
  updated_at: string;
  // Related data
  user_profile?: {
    display_name: string;
    contact_email: string;
  };
  service_request?: {
    message: string;
    inquiry_type: string;
  };
  company_response?: {
    company_response_text?: string;
    company_response_rating?: number;
  };
}

export function CompanyFeedbackManagement() {
  const [receivedFeedback, setReceivedFeedback] = useState<ServiceFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseRating, setResponseRating] = useState(0);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile?.account_type === 'company') {
      fetchReceivedFeedback();

      // Set up real-time subscription for new feedback
      const feedbackChannel = supabase
        .channel('company-feedback')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_feedback',
            filter: `company_id=eq.${profile.id}`
          },
          () => {
            fetchReceivedFeedback();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'service_feedback',
            filter: `company_id=eq.${profile.id}`
          },
          () => {
            fetchReceivedFeedback();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(feedbackChannel);
      };
    }
  }, [user, profile]);

  const fetchReceivedFeedback = async () => {
    try {
      setLoading(true);
      
      const { data: feedbackData, error } = await supabase
        .from('service_feedback')
        .select(`
          *,
          service_inquiries:request_id (
            message,
            inquiry_type
          ),
          service_request_responses:response_id (
            response_message
          )
        `)
        .eq('company_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each feedback
      const feedbackWithProfiles = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('display_name, contact_email')
            .eq('user_id', feedback.user_id)
            .single();

          // Check if company has already responded
          const { data: companyFeedback } = await supabase
            .from('company_feedback')
            .select('company_response_text, company_response_rating')
            .eq('user_review_id', feedback.id)
            .single();

          return {
            ...feedback,
            user_profile: userProfile,
            service_request: feedback.service_inquiries,
            company_response: companyFeedback
          };
        })
      );

      setReceivedFeedback(feedbackWithProfiles);
    } catch (error) {
      console.error('Error fetching received feedback:', error);
      toast({
        title: "Error loading feedback",
        description: "Failed to load received feedback.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToFeedback = async (feedbackId: string) => {
    if (!responseText.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response message.",
        variant: "destructive",
      });
      return;
    }

    try {
      const feedback = receivedFeedback.find(f => f.id === feedbackId);
      if (!feedback) return;

      console.log('Responding to feedback:', { feedbackId, responseText, responseRating });

      // Check if company feedback entry already exists
      const { data: existingFeedback, error: checkError } = await supabase
        .from('company_feedback')
        .select('id')
        .eq('user_review_id', feedback.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing feedback:', checkError);
        throw checkError;
      }

      let result;
      if (existingFeedback) {
        // Update existing company feedback
        result = await supabase
          .from('company_feedback')
          .update({
            company_response_text: responseText,
            company_response_rating: responseRating || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFeedback.id)
          .select();
      } else {
        // Insert new company feedback entry
        result = await supabase
          .from('company_feedback')
          .insert({
            company_id: profile?.id,
            service_inquiry_id: feedback.request_id,
            user_review_id: feedback.id,
            reviewer_name: feedback.user_profile?.display_name || 'User',
            reviewer_email: feedback.user_profile?.contact_email || '',
            rating: feedback.rating,
            feedback_text: feedback.comment,
            project_type: feedback.service_request?.inquiry_type || 'service',
            completion_date: new Date().toISOString().split('T')[0],
            is_verified: true,
            company_response_text: responseText,
            company_response_rating: responseRating || null
          })
          .select();
      }

      console.log('Database operation result:', result);

      if (result.error) {
        console.error('Database error:', result.error);
        throw result.error;
      }

      toast({
        title: "Response sent successfully!",
        description: "Your response has been recorded.",
      });

      setRespondingTo(null);
      setResponseText("");
      setResponseRating(0);
      fetchReceivedFeedback();

    } catch (error) {
      console.error('Error responding to feedback:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "Error sending response",
        description: `Failed to send response: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange?: (rating: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange?.(star)}
          disabled={!onRatingChange}
          className={`transition-colors ${onRatingChange ? 'hover:text-yellow-400' : ''} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          <Star className="h-4 w-4 fill-current" />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading feedback...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Customer Feedback ({receivedFeedback.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {receivedFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No feedback received yet</p>
              <p className="text-sm">Customer feedback will appear here when services are completed</p>
            </div>
          ) : (
            <div className="space-y-6">
              {receivedFeedback.map((feedback) => (
                <div key={feedback.id} className="p-6 border rounded-lg space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">{feedback.user_profile?.display_name || 'Customer'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={feedback.rating} />
                      <p className="text-sm text-muted-foreground">{feedback.rating}/5 overall</p>
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{feedback.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{feedback.comment}</p>
                    </div>

                    {/* Detailed Ratings */}
                    {(feedback.service_quality_rating || feedback.communication_rating || 
                      feedback.timeliness_rating || feedback.value_rating) && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {feedback.service_quality_rating && (
                          <div className="flex items-center justify-between">
                            <span>Service Quality:</span>
                            <StarRating rating={feedback.service_quality_rating} />
                          </div>
                        )}
                        {feedback.communication_rating && (
                          <div className="flex items-center justify-between">
                            <span>Communication:</span>
                            <StarRating rating={feedback.communication_rating} />
                          </div>
                        )}
                        {feedback.timeliness_rating && (
                          <div className="flex items-center justify-between">
                            <span>Timeliness:</span>
                            <StarRating rating={feedback.timeliness_rating} />
                          </div>
                        )}
                        {feedback.value_rating && (
                          <div className="flex items-center justify-between">
                            <span>Value:</span>
                            <StarRating rating={feedback.value_rating} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendation */}
                    <div className="flex items-center gap-2">
                      {feedback.would_recommend ? (
                        <>
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Would recommend</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Would not recommend</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Original Service Request */}
                  {feedback.service_request && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Original Request:</p>
                      <p className="text-sm">{feedback.service_request.message}</p>
                    </div>
                  )}

                  {/* Company Response Section */}
                  {feedback.company_response?.company_response_text ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Your Response</span>
                        {feedback.company_response.company_response_rating && (
                          <StarRating rating={feedback.company_response.company_response_rating} />
                        )}
                      </div>
                      <p className="text-sm">{feedback.company_response.company_response_text}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {respondingTo === feedback.id ? (
                        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Your Response:</label>
                            <Textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Thank you for your feedback. We appreciate..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rate this customer (optional):</label>
                            <StarRating 
                              rating={responseRating} 
                              onRatingChange={setResponseRating}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleRespondToFeedback(feedback.id)}
                            >
                              Send Response
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText("");
                                setResponseRating(0);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setRespondingTo(feedback.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Respond to Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}