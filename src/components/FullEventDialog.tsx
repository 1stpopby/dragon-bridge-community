import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, Clock, User, Building2, Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface FullEventDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventChanged: () => void;
}

export function FullEventDialog({ event, open, onOpenChange, onEventChanged }: FullEventDialogProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    phone: '',
    special_requirements: ''
  });
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Check if user is already registered for this event
  const checkRegistrationStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .eq('registration_status', 'registered')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking registration:', error);
      } else {
        setIsRegistered(!!data);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  useEffect(() => {
    if (user && open) {
      checkRegistrationStatus();
    } else {
      setIsRegistered(false);
    }
  }, [user, event.id, open]);

  const handleRegisterForEvent = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      // Insert registration
      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          attendee_name: profile.display_name,
          attendee_email: profile.contact_email,
          phone: registrationData.phone || profile.phone,
          special_requirements: registrationData.special_requirements
        });

      if (registrationError) {
        if (registrationError.code === '23505') {
          toast({
            title: "Already registered",
            description: "You are already registered for this event.",
            variant: "destructive",
          });
          setIsRegistered(true);
        } else {
          throw registrationError;
        }
      } else {
        // Update attendee count
        const { error: updateError } = await supabase
          .from('events')
          .update({ 
            attendees: (event.attendees || 0) + 1 
          })
          .eq('id', event.id);

        if (updateError) {
          console.error('Error updating attendee count:', updateError);
        }

        toast({
          title: "Registration successful!",
          description: "You have been registered for this event.",
        });
        setIsRegistered(true);
        setRegistrationOpen(false);
        setRegistrationData({ phone: '', special_requirements: '' });
        onEventChanged();
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: "Registration failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVariantForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cultural': return 'default';
      case 'professional': return 'secondary';
      case 'educational': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Event Image */}
            {event.image_url && (
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(event.date)}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{event.attendees || 0} attendees</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Organizer</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.author_name}</span>
                  </div>
                </div>

                <div>
                  <Badge variant={getVariantForCategory(event.category)} className="text-sm">
                    {event.category}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {/* Registration Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Registration</h3>
                  {event.status === 'upcoming' ? (
                    !user || !profile ? (
                      <Button asChild className="w-full">
                        <Link to="/auth" className="flex items-center justify-center gap-2">
                          <Lock className="h-4 w-4" />
                          Sign in to Register
                        </Link>
                      </Button>
                    ) : isRegistered ? (
                      <Button className="w-full" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Joined
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => setRegistrationOpen(true)}
                      >
                        Register Now
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Event Ended
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Register for {event.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{profile?.display_name}</p>
                {profile?.company_name && (
                  <p className="text-xs text-muted-foreground">{profile.company_name}</p>
                )}
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{profile?.contact_email || user?.email}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="Your phone number"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="requirements">Special Requirements (Optional)</Label>
              <Textarea
                id="requirements"
                placeholder="Any dietary requirements, accessibility needs, etc."
                value={registrationData.special_requirements}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, special_requirements: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegistrationOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRegisterForEvent} disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}