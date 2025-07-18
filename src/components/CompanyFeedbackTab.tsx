import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, 
  MessageSquare, 
  Calendar,
  CheckCircle,
  Loader2,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanyFeedback {
  id: string;
  company_id: string;
  service_inquiry_id: string | null;
  user_review_id?: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  feedback_text: string | null;
  project_type: string | null;
  completion_date: string | null;
  is_verified: boolean;
  company_response_text?: string | null;
  company_response_rating?: number | null;
  created_at: string;
  updated_at: string;
  // Additional data from linked service feedback
  user_feedback?: any;
}

interface CompanyFeedbackTabProps {
  companyId: string;
  isOwner: boolean;
}

const CompanyFeedbackTab = ({ companyId, isOwner }: CompanyFeedbackTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<CompanyFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterProjectType, setFilterProjectType] = useState<string>("all");
  const [stats, setStats] = useState({
    averageRating: 0,
    totalFeedback: 0,
    verifiedFeedback: 0
  });
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<CompanyFeedback | null>(null);
  const [responseData, setResponseData] = useState({
    response_text: "",
    response_rating: 5
  });

  useEffect(() => {
    fetchFeedback();
  }, [companyId]);

  const fetchFeedback = async () => {
    try {
      // Fetch all feedback for the company (both old and new format)
      const { data, error } = await supabase
        .from('company_feedback')
        .select(`
          *,
          user_feedback:service_feedback!user_review_id(
            id,
            title,
            comment,
            rating,
            would_recommend,
            service_quality_rating,
            communication_rating,
            timeliness_rating,
            value_rating,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      console.log('Fetched feedback data:', data);
      console.log('Company ID:', companyId);

      if (error) throw error;
      
      const feedbackData = data || [];
      setFeedback(feedbackData);

      // Calculate stats
      if (feedbackData.length > 0) {
        const avgRating = feedbackData.reduce((sum, item) => sum + item.rating, 0) / feedbackData.length;
        const verifiedCount = feedbackData.filter(item => item.is_verified).length;
        
        setStats({
          averageRating: avgRating,
          totalFeedback: feedbackData.length,
          verifiedFeedback: verifiedCount
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error loading feedback",
        description: "Failed to load company feedback.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFeedback) return;

    try {
      const { error } = await supabase
        .from('company_feedback')
        .update({
          company_response_text: responseData.response_text,
          company_response_rating: responseData.response_rating
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({
        title: "Response submitted",
        description: "Your response has been submitted successfully.",
      });

      setIsResponseDialogOpen(false);
      setSelectedFeedback(null);
      setResponseData({ response_text: "", response_rating: 5 });
      fetchFeedback();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error submitting response",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openResponseDialog = (feedback: CompanyFeedback) => {
    setSelectedFeedback(feedback);
    setResponseData({
      response_text: feedback.company_response_text || "",
      response_rating: feedback.company_response_rating || 5
    });
    setIsResponseDialogOpen(true);
  };

  const filteredFeedback = feedback.filter(item => {
    if (filterRating !== "all" && item.rating !== parseInt(filterRating)) {
      return false;
    }
    if (filterProjectType !== "all" && item.project_type !== filterProjectType) {
      return false;
    }
    return true;
  });

  const getProjectTypes = () => {
    const types = feedback.map(item => item.project_type).filter(Boolean) as string[];
    return [...new Set(types)];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <div className="flex items-center mt-1">
              {renderStars(Math.round(stats.averageRating))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              Client reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Reviews</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedFeedback}</div>
            <p className="text-xs text-muted-foreground">
              Verified clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>
        
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
            <SelectItem value="1">1+ Stars</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProjectType} onValueChange={setFilterProjectType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Project Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {getProjectTypes().map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {feedback.length === 0 ? "No feedback received yet" : "No feedback matches your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {item.reviewer_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{item.reviewer_name}</h4>
                        {item.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(item.rating)}
                        <span className="text-sm text-muted-foreground">
                          {item.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(item.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.feedback_text && (
                  <p className="text-sm leading-relaxed">
                    "{item.feedback_text}"
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {item.project_type && (
                    <Badge variant="outline" className="text-xs">
                      {item.project_type}
                    </Badge>
                  )}
                  {item.completion_date && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Completed {format(new Date(item.completion_date), 'MMM yyyy')}
                    </Badge>
                  )}
                </div>

                {/* Company Response */}
                {item.company_response_text && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Your Response:</span>
                      {item.company_response_rating && (
                        <div className="flex items-center gap-1">
                          {renderStars(item.company_response_rating)}
                          <span className="text-xs text-muted-foreground">
                            {item.company_response_rating}/5
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "{item.company_response_text}"
                    </p>
                  </div>
                )}

                {/* Response Button for Company Owner */}
                {isOwner && !item.company_response_text && (
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openResponseDialog(item)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Respond to Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResponseSubmit} className="space-y-4">
            <div>
              <Label htmlFor="response_rating">Rate the Client</Label>
              <Select
                value={responseData.response_rating.toString()}
                onValueChange={(value) => setResponseData({ ...responseData, response_rating: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Very Good</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="1">1 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="response_text">Your Response</Label>
              <Textarea
                id="response_text"
                value={responseData.response_text}
                onChange={(e) => setResponseData({ ...responseData, response_text: e.target.value })}
                placeholder="Share your thoughts about working with this client..."
                rows={4}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Submit Response
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyFeedbackTab; 