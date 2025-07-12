import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, Calendar, MessageSquare, Heart, Award } from "lucide-react";

const Community = () => {
  const communityGroups = [
    {
      name: "London Chinese Professionals",
      members: 1250,
      location: "London",
      description: "Network of Chinese professionals in finance, tech, and business across London.",
      category: "Professional",
      image: "/placeholder.svg"
    },
    {
      name: "Manchester Family Circle",
      members: 845,
      location: "Manchester", 
      description: "Supporting Chinese families with children, sharing parenting tips and organizing family activities.",
      category: "Family",
      image: "/placeholder.svg"
    },
    {
      name: "Edinburgh Students United",
      members: 650,
      location: "Edinburgh",
      description: "Chinese students at Edinburgh universities supporting each other academically and socially.",
      category: "Students",
      image: "/placeholder.svg"
    },
    {
      name: "Birmingham Cultural Society",
      members: 520,
      location: "Birmingham",
      description: "Preserving and celebrating Chinese culture through traditional arts, music, and festivals.",
      category: "Cultural",
      image: "/placeholder.svg"
    },
    {
      name: "Bristol Young Professionals", 
      members: 380,
      location: "Bristol",
      description: "Young Chinese professionals building careers and friendships in the Bristol area.",
      category: "Professional",
      image: "/placeholder.svg"
    },
    {
      name: "Leeds Healthcare Workers",
      members: 290,
      location: "Leeds",
      description: "Chinese healthcare professionals sharing experiences and supporting each other.",
      category: "Professional",
      image: "/placeholder.svg"
    }
  ];

  const featuredMembers = [
    {
      name: "Dr. Wei Chen",
      role: "Community Leader",
      location: "London",
      contributions: "Organized 15+ healthcare workshops",
      avatar: "/placeholder.svg"
    },
    {
      name: "Li Zhang",
      role: "Event Coordinator", 
      location: "Manchester",
      contributions: "Led 20+ cultural celebrations",
      avatar: "/placeholder.svg"
    },
    {
      name: "Alex Wang",
      role: "Youth Ambassador",
      location: "Edinburgh", 
      contributions: "Mentored 50+ students",
      avatar: "/placeholder.svg"
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
              Our Community
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with Chinese communities across the UK. Find your local group, 
              meet like-minded people, and build lasting friendships.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15,247</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">25</div>
              <div className="text-sm text-muted-foreground">Local Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">156</div>
              <div className="text-sm text-muted-foreground">Events This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Cities Covered</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Community Groups */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Local Community Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityGroups.map((group, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{group.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      {group.members}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {group.location}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {group.description}
                  </p>
                  <Button className="w-full">Join Group</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Members */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Featured Community Leaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredMembers.map((member, index) => (
              <Card key={index} className="border-border text-center">
                <CardContent className="pt-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                  <Badge variant="outline" className="mb-2">{member.role}</Badge>
                  <div className="flex items-center justify-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {member.location}
                  </div>
                  <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
                    <Award className="h-4 w-4 mr-1" />
                    {member.contributions}
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Community;