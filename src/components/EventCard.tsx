import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, Clock, Trash2, Lock, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { EventDialog } from "./EventDialog";
import { Link } from "react-router-dom";

interface EventCardProps {
  event: any;
  onEventChanged: () => void;
  showActions?: boolean;
}

export function EventCard({ event, onEventChanged, showActions = true }: EventCardProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    phone: '',
    special_requirements: ''
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Check if user can manage events (admin or company profile)
  const checkEventManagementPermissions = async () => {
    if (!user) {
      setCanManageEvents(false);
      setIsAdmin(false);
      return;
    }

    try {
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      const userIsAdmin = !!adminData;
      setIsAdmin(userIsAdmin);

      // Check if user can manage events (admin or company profile)
      const canManage = userIsAdmin || (profile?.account_type === 'company');
      setCanManageEvents(canManage);
    } catch (error) {
      console.error('Error checking event management permissions:', error);
      setCanManageEvents(false);
      setIsAdmin(false);
    }
  };

  // Check if user is already registered for this event
  const checkRegistrationStatus = async () => {
    if (!user) return;
    
    setCheckingRegistration(true);
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
    } finally {
      setCheckingRegistration(false);
    }
  };

  // Check registration status and permissions when component mounts or user changes
  useEffect(() => {
    if (user) {
      checkRegistrationStatus();
      checkEventManagementPermissions();
    } else {
      setIsRegistered(false);
      setCanManageEvents(false);
      setIsAdmin(false);
    }
  }, [user, profile, event.id]);

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
          // Don't throw here - registration was successful
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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Event deleted successfully",
        description: "The event has been removed from the calendar.",
      });

      onEventChanged();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error deleting event",
        description: "Please try again later.",
        variant: "destructive",
      });
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
    <Card className="border-border hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={getVariantForCategory(event.category)}>
            {event.category}
          </Badge>
          <span className="text-sm text-muted-foreground flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {event.attendees || 0}
          </span>
        </div>
        <CardTitle className="text-lg">{event.title}</CardTitle>
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.date)}
          </div>
          {event.time && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {event.time}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
        </div>
        
        {showActions ? (
          <div className="flex gap-2 mt-4">
            {event.status === 'upcoming' ? (
              !user || !profile ? (
                <Button asChild className="flex-1">
                  <Link to="/auth" className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    Sign in to Register
                  </Link>
                </Button>
              ) : (
                <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      {isRegistered ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Joined
                        </>
                      ) : (
                        'Register Now'
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Register for {event.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium">{profile.display_name}</p>
                          {profile.company_name && (
                            <p className="text-xs text-muted-foreground">{profile.company_name}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{profile.contact_email || user.email}</p>
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
              )
            ) : (
              <Button variant="outline" className="flex-1">View Details</Button>
            )}
            {canManageEvents && (
              <>
                <EventDialog
                  event={event}
                  onEventSaved={onEventChanged}
                  mode="edit"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{event.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        ) : (
          !user || !profile ? (
            <Button asChild className="w-full mt-4">
              <Link to="/auth" className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Sign in to Register
              </Link>
            </Button>
          ) : (
            <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-4">
                  {event.status === 'upcoming' ? 'Register Now' : 'View Details'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Register for {event.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">{profile.display_name}</p>
                      {profile.company_name && (
                        <p className="text-xs text-muted-foreground">{profile.company_name}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{profile.contact_email || user.email}</p>
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
          )
        )}
        
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Organized by {event.author_name}
        </div>
      </CardContent>
    </Card>
  );
}