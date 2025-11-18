import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EventDialog } from "@/components/EventDialog";
import { EventCard } from "@/components/EventCard";
import { useToast } from "@/hooks/use-toast";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Eroare la încărcarea evenimentelor",
        description: "Nu s-au putut încărca evenimentele din bază de date.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filterEvents = (eventList: any[], searchTerm: string) => {
    if (!searchTerm) return eventList;
    return eventList.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const upcomingEvents = filterEvents(
    events.filter(event => new Date(event.date) >= new Date() || event.status === 'upcoming'),
    searchTerm
  );

  const pastEvents = filterEvents(
    events.filter(event => new Date(event.date) < new Date() || event.status === 'past'),
    searchTerm
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Evenimente Comunitare
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Alătură-te evenimentelor noastre vibrante, de la celebrări culturale la networking 
              profesional și ateliere educaționale în toată România și UE.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Caută evenimente..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <EventDialog onEventSaved={fetchEvents} />
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">
              Evenimente Viitoare ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Evenimente Trecute ({pastEvents.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Se încarcă evenimentele...</p>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Niciun eveniment viitor nu corespunde căutării.' : 'Încă nu există evenimente viitoare. Creează primul!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, index) => (
                  <div key={`upcoming-${event.id}`} className="contents">
                    {/* Insert ad after 1st event, then every 4 events */}
                    {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                      <div className="col-span-full mb-6">
                        <AdvertisementBanner 
                          location="events" 
                          variant="card" 
                          maxAds={1}
                        />
                      </div>
                    )}
                    <EventCard
                      event={event}
                      onEventChanged={fetchEvents}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Se încarcă evenimentele...</p>
              </div>
            ) : pastEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Niciun eveniment trecut nu corespunde căutării.' : 'Nu au fost găsite evenimente trecute.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event, index) => (
                  <div key={`past-${event.id}`} className="contents">
                    {/* Insert ad after 1st event, then every 4 events */}
                    {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                      <div className="col-span-full mb-6">
                        <AdvertisementBanner 
                          location="events" 
                          variant="card" 
                          maxAds={1}
                        />
                      </div>
                    )}
                    <EventCard
                      event={event}
                      onEventChanged={fetchEvents}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      <MobileNavigation />
    </div>
  );
};

export default Events;