import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Star, 
  MessageSquare, 
  Building2, 
  CheckCircle,
  ThumbsUp,
  Clock,
  DollarSign,
  Phone,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ServiceFeedbackDialogProps {
  response: {
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
    company_verified?: boolean;
  };
  triggerButton: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFeedbackSubmitted?: () => void;
}

export function ServiceFeedbackDialog({ 
  response, 
  triggerButton, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  onFeedbackSubmitted
}: ServiceFeedbackDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    would_recommend: true,
    service_quality_rating: 0,
    communication_rating: 0,
    timeliness_rating: 0,
    value_rating: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim() || !formData.comment.trim()) {
      toast({
        title: "Review details required",
        description: "Please provide both a title and comment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if feedback already exists for this response from this user
      const { data: existingFeedback, error: checkError } = await supabase
        .from('service_feedback')
        .select('id')
        .eq('response_id', response.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      if (existingFeedback) {
        // Update existing feedback
        result = await supabase
          .from('service_feedback')
          .update({
            rating: formData.rating,
            title: formData.title,
            comment: formData.comment,
            would_recommend: formData.would_recommend,
            service_quality_rating: formData.service_quality_rating || null,
            communication_rating: formData.communication_rating || null,
            timeliness_rating: formData.timeliness_rating || null,
            value_rating: formData.value_rating || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFeedback.id)
          .select();
      } else {
        // Insert new feedback
        result = await supabase
          .from('service_feedback')
          .insert({
            response_id: response.id,
            request_id: response.request_id,
            user_id: user?.id,
            company_id: response.company_id,
            rating: formData.rating,
            title: formData.title,
            comment: formData.comment,
            would_recommend: formData.would_recommend,
            service_quality_rating: formData.service_quality_rating || null,
            communication_rating: formData.communication_rating || null,
            timeliness_rating: formData.timeliness_rating || null,
            value_rating: formData.value_rating || null
          })
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: `Feedback ${existingFeedback ? 'updated' : 'submitted'} successfully!`,
        description: `Thank you for your ${formData.rating}-star review! Your feedback helps other users make informed decisions and helps improve service quality.`,
        duration: 5000,
      });

      setOpen(false);
      setFormData({
        rating: 0,
        title: '',
        comment: '',
        would_recommend: true,
        service_quality_rating: 0,
        communication_rating: 0,
        timeliness_rating: 0,
        value_rating: 0
      });

      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: "There was a problem submitting your feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    label, 
    required = false 
  }: { 
    rating: number; 
    onRatingChange: (rating: number) => void; 
    label: string; 
    required?: boolean; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`transition-colors hover:text-yellow-400 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Leave Service Feedback
          </DialogTitle>
          <DialogDescription>
            Share your experience with this service to help other users make informed decisions.
          </DialogDescription>
        </DialogHeader>

        {/* Company Info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">
                    {response.company_name || response.company_display_name}
                  </CardTitle>
                  {response.company_location && (
                    <p className="text-sm text-muted-foreground">
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
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-line">{response.response_message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              {response.contact_email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.contact_email}</span>
                </div>
              )}
              {response.contact_phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.contact_phone}</span>
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
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.availability}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            label="Overall Rating"
            required
          />

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Excellent service, highly recommend"
              required
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this service provider..."
              rows={4}
              required
            />
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Detailed Ratings (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating
                rating={formData.service_quality_rating}
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, service_quality_rating: rating }))}
                label="Service Quality"
              />
              <StarRating
                rating={formData.communication_rating}
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, communication_rating: rating }))}
                label="Communication"
              />
              <StarRating
                rating={formData.timeliness_rating}
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, timeliness_rating: rating }))}
                label="Timeliness"
              />
              <StarRating
                rating={formData.value_rating}
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, value_rating: rating }))}
                label="Value for Money"
              />
            </div>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-medium">Would you recommend this service?</Label>
                <p className="text-sm text-muted-foreground">
                  Help other users know if you'd recommend this service provider
                </p>
              </div>
            </div>
            <Switch
              checked={formData.would_recommend}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, would_recommend: checked }))}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 