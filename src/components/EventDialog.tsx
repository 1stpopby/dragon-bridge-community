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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventDialogProps {
  event?: any;
  onEventSaved: () => void;
  mode?: 'create' | 'edit';
}

export function EventDialog({ event, onEventSaved, mode = 'create' }: EventDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time || '',
    location: event?.location || '',
    category: event?.category || 'Cultural',
    image_url: event?.image_url || '',
    author_name: event?.author_name || 'Community Member'
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        const { error } = await supabase
          .from('events')
          .insert([{
            ...formData,
            status: new Date(formData.date) >= new Date() ? 'upcoming' : 'past'
          }]);

        if (error) throw error;

        toast({
          title: "Event created successfully!",
          description: "Your event has been added to the community calendar.",
        });
      } else {
        const { error } = await supabase
          .from('events')
          .update({
            ...formData,
            status: new Date(formData.date) >= new Date() ? 'upcoming' : 'past'
          })
          .eq('id', event.id);

        if (error) throw error;

        toast({
          title: "Event updated successfully!",
          description: "Your changes have been saved.",
        });
      }

      setOpen(false);
      onEventSaved();
      
      // Reset form for create mode
      if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          category: 'Cultural',
          image_url: '',
          author_name: 'Community Member'
        });
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error saving event",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="default" className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Event' : 'Edit Event'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to create a new community event.'
              : 'Update the event details below.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="e.g. 2:00 PM - 6:00 PM"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Event location"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Educational">Educational</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="author_name">Organizer Name</Label>
              <Input
                id="author_name"
                value={formData.author_name}
                onChange={(e) => handleInputChange('author_name', e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="image_url">Image URL (optional)</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}