-- Create function to update event attendee count
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment attendee count when a registration is added
    UPDATE public.events 
    SET attendees = attendees + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement attendee count when a registration is removed
    UPDATE public.events 
    SET attendees = attendees - 1 
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes (e.g., cancelled registrations)
    IF OLD.registration_status = 'registered' AND NEW.registration_status != 'registered' THEN
      -- User cancelled or status changed from registered
      UPDATE public.events 
      SET attendees = attendees - 1 
      WHERE id = OLD.event_id;
    ELSIF OLD.registration_status != 'registered' AND NEW.registration_status = 'registered' THEN
      -- User re-registered or status changed to registered
      UPDATE public.events 
      SET attendees = attendees + 1 
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update attendee count
CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_attendee_count();

-- Fix existing event attendee counts by calculating actual registered users
UPDATE public.events 
SET attendees = (
  SELECT COUNT(*) 
  FROM public.event_registrations 
  WHERE event_registrations.event_id = events.id 
  AND event_registrations.registration_status = 'registered'
);