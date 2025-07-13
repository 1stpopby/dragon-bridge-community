import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  title: string;
  content: string;
  created_at: string;
}

interface CompanyReviewSectionProps {
  companyId: string;
  onReviewUpdate: () => void;
}

const CompanyReviewSection = ({ companyId, onReviewUpdate }: CompanyReviewSectionProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    content: ""
  });

  useEffect(() => {
    fetchReviews();
  }, [companyId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReviews(data || []);
      
      // Check if current user has already reviewed
      if (user) {
        const existingReview = data?.find(review => review.reviewer_id === user.id);
        setUserReview(existingReview || null);
        
        if (existingReview) {
          setFormData({
            rating: existingReview.rating,
            title: existingReview.title,
            content: existingReview.content
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('company_reviews')
          .update({
            rating: formData.rating,
            title: formData.title.trim(),
            content: formData.content.trim()
          })
          .eq('id', userReview.id);

        if (error) throw error;
        
        toast({
          title: "Review updated",
          description: "Your review has been updated successfully.",
        });
      } else {
        // Create new review
        const { error } = await supabase
          .from('company_reviews')
          .insert({
            company_id: companyId,
            reviewer_id: user.id,
            reviewer_name: profile?.display_name || user.email?.split('@')[0] || 'Anonymous',
            reviewer_avatar: profile?.avatar_url,
            rating: formData.rating,
            title: formData.title.trim(),
            content: formData.content.trim()
          });

        if (error) throw error;
        
        toast({
          title: "Review submitted",
          description: "Your review has been submitted successfully.",
        });
      }

      setShowForm(false);
      fetchReviews();
      onReviewUpdate();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setFormData(prev => ({ ...prev, rating: star })) : undefined}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Form */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {userReview ? 'Update Your Review' : 'Write a Review'}
              {!showForm && (
                <Button onClick={() => setShowForm(true)} size="sm">
                  {userReview ? 'Edit Review' : 'Write Review'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          {showForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <div className="mt-1">
                    {renderStars(formData.rating, true)}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Review Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Review Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your detailed experience..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {userReview ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {userReview ? 'Update Review' : 'Submit Review'}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Be the first to leave a review!</p>
          </div>
        ) : (
          reviews.map(review => {
            const initials = review.reviewer_name
              ? review.reviewer_name.split(' ').map(n => n[0]).join('').toUpperCase()
              : '?';

            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer_avatar || undefined} alt={review.reviewer_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.reviewer_name}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-2">{review.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CompanyReviewSection;