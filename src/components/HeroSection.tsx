import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Forum Comunitar",
      description: "Conectează-te cu români și europeni din întreaga Românie și UE"
    },
    {
      icon: Calendar,
      title: "Evenimente Locale",
      description: "Descoperă evenimente culturale și întâlniri în zona ta"
    },
    {
      icon: Users,
      title: "Rețea de Sprijin",
      description: "Găsește ajutor și oferă asistență în cadrul comunității noastre"
    },
    {
      icon: Globe,
      title: "Punte Culturală",
      description: "Menține legăturile cu cultura română în contextul european"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Bine ai venit în
            <span className="text-gradient-primary block mt-2">Comunitatea RoEu</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Conectează-te, împărtășește și crește alături de comunitate.
Fă parte din miile de români din întreaga Europă care își împărtășesc experiențele, se sprijină reciproc și celebrează cultura ce ne unește.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link to="/auth">Alătură-te Comunității</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3" asChild>
              <Link to="/forum">Explorează Forumul</Link>
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
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
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