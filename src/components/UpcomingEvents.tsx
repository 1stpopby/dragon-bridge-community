import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

const UpcomingEvents = () => {
  const events = [
    {
      title: "Chinese New Year Celebration",
      date: "Feb 10, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Chinatown, London",
      attendees: 450,
      type: "Cultural"
    },
    {
      title: "Manchester Chinese Association Meetup",
      date: "Feb 15, 2024",
      time: "6:30 PM - 9:00 PM",
      location: "Manchester Central Library",
      attendees: 85,
      type: "Networking"
    },
    {
      title: "Mandarin Language Exchange",
      date: "Feb 17, 2024",
      time: "11:00 AM - 1:00 PM",
      location: "Edinburgh University",
      attendees: 32,
      type: "Education"
    }
  ];

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Cultural": "bg-red-100 text-red-800",
      "Networking": "bg-blue-100 text-blue-800",
      "Education": "bg-green-100 text-green-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground">
              Join local events and connect with community members near you
            </p>
          </div>
          <Button variant="outline">
            View All Events
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`${getTypeColor(event.type)}`}
                  >
                    {event.type}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {event.attendees}
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold line-clamp-2">
                  {event.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <Button className="w-full mt-4" variant="outline">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingEvents;