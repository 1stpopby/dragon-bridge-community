import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, Globe } from "lucide-react";

const HeroSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Community Forum",
      description: "Connect with fellow Chinese residents across the UK"
    },
    {
      icon: Calendar,
      title: "Local Events",
      description: "Discover cultural events and meetups in your area"
    },
    {
      icon: Users,
      title: "Support Network",
      description: "Find help and offer assistance within our community"
    },
    {
      icon: Globe,
      title: "Cultural Bridge",
      description: "Maintain connections to Chinese culture while embracing UK life"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Welcome to the
            <span className="text-primary block mt-2">UK Chinese Community</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Connect, share, and thrive together. Join thousands of Chinese residents 
            across the UK sharing experiences, offering support, and celebrating our culture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3">
              Join Our Community
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Explore Forum
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;