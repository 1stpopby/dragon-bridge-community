import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Calendar, MapPin, Users, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EventDialog } from "./EventDialog";

interface EventCardProps {
  event: any;
  onEventChanged: () => void;
  showActions?: boolean;
}

export function EventCard({ event, onEventChanged, showActions = true }: EventCardProps) {
  const { toast } = useToast();

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
              <Button className="flex-1">Register Now</Button>
            ) : (
              <Button variant="outline" className="flex-1">View Details</Button>
            )}
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
          </div>
        ) : (
          <Button className="w-full mt-4">
            {event.status === 'upcoming' ? 'Register Now' : 'View Details'}
          </Button>
        )}
        
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Organized by {event.author_name}
        </div>
      </CardContent>
    </Card>
  );
}