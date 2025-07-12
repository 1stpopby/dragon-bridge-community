import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Plus, Search } from "lucide-react";

const Events = () => {
  const upcomingEvents = [
    {
      title: "Chinese New Year Celebration 2024",
      date: "February 10, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Manchester Town Hall",
      attendees: 250,
      category: "Cultural",
      image: "/placeholder.svg"
    },
    {
      title: "Professional Networking Evening",
      date: "January 25, 2024",
      time: "6:00 PM - 9:00 PM",
      location: "London Business Center",
      attendees: 85,
      category: "Professional",
      image: "/placeholder.svg"
    },
    {
      title: "Traditional Cooking Workshop",
      date: "January 30, 2024",
      time: "10:00 AM - 2:00 PM",
      location: "Birmingham Community Center",
      attendees: 45,
      category: "Educational",
      image: "/placeholder.svg"
    }
  ];

  const pastEvents = [
    {
      title: "Mid-Autumn Festival Gathering",
      date: "September 15, 2023",
      location: "Edinburgh Castle Gardens",
      attendees: 180,
      category: "Cultural"
    },
    {
      title: "Healthcare Information Session",
      date: "November 20, 2023",
      location: "Leeds Medical Center",
      attendees: 95,
      category: "Educational"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Community Events
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our vibrant community events, from cultural celebrations to professional 
              networking and educational workshops across the UK.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-10"
              />
            </div>
            <Button size="default" className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{event.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {event.attendees}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                    <Button className="w-full mt-4">Register Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="past">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow opacity-75">
                  <div className="aspect-video bg-muted/50 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{event.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {event.attendees}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">View Details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Events;