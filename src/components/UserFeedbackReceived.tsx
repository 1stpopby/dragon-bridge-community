import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Building2, 
  MessageSquare, 
  ThumbsUp,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface CompanyFeedback {
  id: string;
  company_id: string;
  service_inquiry_id: string;
  user_review_id?: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  feedback_text: string;
  project_type?: string;
  completion_date?: string;
  is_verified: boolean;
  company_response_text?: string;
  company_response_rating?: number;
  created_at: string;
  updated_at: string;
  // Related data
  company_profile?: {
    display_name: string;
    company_name: string;
    is_verified: boolean;
  };
  service_request?: {
    message: string;
    inquiry_type: string;
  };
}

export function UserFeedbackReceived() {
  const [receivedFeedback, setReceivedFeedback] = useState<CompanyFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReceivedFeedback();

      // Set up real-time subscription for new feedback
      const feedbackChannel = supabase
        .channel('user-feedback-received')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'company_feedback',
            filter: `reviewer_email=eq.${profile?.contact_email}`
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
            table: 'company_feedback',
            filter: `reviewer_email=eq.${profile?.contact_email}`
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
      
      // Get feedback where this user is the reviewer (meaning companies gave feedback about them)
      const { data: feedbackData, error } = await supabase
        .from('company_feedback')
        .select(`
          *,
          service_inquiries:service_inquiry_id (
            message,
            inquiry_type
          )
        `)
        .eq('reviewer_email', profile?.contact_email)
        .not('company_response_text', 'is', null) // Only show feedback where company has responded
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch company profiles for each feedback
      const feedbackWithProfiles = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          const { data: companyProfile } = await supabase
            .from('profiles')
            .select('display_name, company_name, is_verified')
            .eq('id', feedback.company_id)
            .single();

          return {
            ...feedback,
            company_profile: companyProfile,
            service_request: feedback.service_inquiries
          };
        })
      );

      setReceivedFeedback(feedbackWithProfiles);
    } catch (error) {
      console.error('Error fetching received feedback:', error);
      toast({
        title: "Error loading feedback",
        description: "Failed to load feedback from companies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 fill-current ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        />
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
          <ThumbsUp className="h-5 w-5" />
          Feedback from Companies ({receivedFeedback.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {receivedFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ThumbsUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No feedback received yet</p>
              <p className="text-sm">Feedback from companies will appear here after completed services</p>
            </div>
          ) : (
            <div className="space-y-6">
              {receivedFeedback.map((feedback) => (
                <div key={feedback.id} className="p-6 border rounded-lg space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {feedback.company_profile?.company_name || feedback.company_profile?.display_name || 'Company'}
                          {feedback.company_profile?.is_verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(feedback.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {feedback.company_response_rating && (
                        <>
                          <StarRating rating={feedback.company_response_rating} />
                          <p className="text-sm text-muted-foreground">{feedback.company_response_rating}/5 rating</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Company Response */}
                  {feedback.company_response_text && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Company Feedback</span>
                      </div>
                      <p className="text-sm">{feedback.company_response_text}</p>
                    </div>
                  )}

                  {/* Service Details */}
                  {feedback.service_request && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Service: {feedback.project_type || feedback.service_request.inquiry_type}
                      </p>
                      <p className="text-sm">{feedback.service_request.message}</p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {feedback.completion_date && (
                        <span>Completed: {new Date(feedback.completion_date).toLocaleDateString()}</span>
                      )}
                      {feedback.is_verified && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Service
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}