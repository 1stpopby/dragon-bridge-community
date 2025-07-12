import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Globe, Star, Search, Filter } from "lucide-react";

const Services = () => {
  const services = {
    legal: [
      {
        name: "Chen & Associates Legal Services",
        specialty: "Immigration & Business Law",
        location: "London",
        phone: "+44 20 7123 4567",
        rating: 4.8,
        reviews: 156,
        languages: ["English", "Mandarin", "Cantonese"],
        description: "Specialist immigration lawyers helping Chinese nationals with visa applications, business setup, and legal compliance."
      },
      {
        name: "UK China Legal Solutions",
        specialty: "Property & Contract Law", 
        location: "Manchester",
        phone: "+44 161 234 5678",
        rating: 4.6,
        reviews: 89,
        languages: ["English", "Mandarin"],
        description: "Expert legal advice for property transactions, rental agreements, and contract negotiations."
      }
    ],
    medical: [
      {
        name: "Dr. Wei Liu - Private Practice",
        specialty: "General Practice & Traditional Medicine",
        location: "Birmingham",
        phone: "+44 121 345 6789",
        rating: 4.9,
        reviews: 203,
        languages: ["English", "Mandarin", "Cantonese"],
        description: "Combining western medicine with traditional Chinese medicine approaches for comprehensive healthcare."
      },
      {
        name: "London Chinese Medical Centre",
        specialty: "Family Medicine & Pediatrics",
        location: "London",
        phone: "+44 20 8765 4321",
        rating: 4.7,
        reviews: 178,
        languages: ["English", "Mandarin"],
        description: "Family-focused medical care with understanding of Chinese cultural health practices and dietary needs."
      }
    ],
    financial: [
      {
        name: "Sino-British Financial Advisory",
        specialty: "Mortgages & Investment Planning",
        location: "London",
        phone: "+44 20 9876 5432",
        rating: 4.8,
        reviews: 124,
        languages: ["English", "Mandarin"],
        description: "Specialized in helping Chinese nationals secure mortgages and plan investments in the UK market."
      },
      {
        name: "Cross-Border Tax Solutions",
        specialty: "Tax Planning & Compliance",
        location: "Edinburgh",
        phone: "+44 131 654 3210",
        rating: 4.5,
        reviews: 67,
        languages: ["English", "Mandarin"],
        description: "Expert guidance on UK-China tax implications, offshore accounts, and compliance requirements."
      }
    ],
    education: [
      {
        name: "Cambridge Chinese Tutorial Centre",
        specialty: "Academic Support & Tutoring",
        location: "Cambridge", 
        phone: "+44 1223 456 789",
        rating: 4.9,
        reviews: 245,
        languages: ["English", "Mandarin"],
        description: "Supporting Chinese students with academic tutoring, university applications, and study skills development."
      },
      {
        name: "Mandarin Heritage School",
        specialty: "Chinese Language & Culture",
        location: "Oxford",
        phone: "+44 1865 987 654",
        rating: 4.7,
        reviews: 156,
        languages: ["English", "Mandarin", "Cantonese"],
        description: "Weekend Chinese school offering Mandarin language classes and cultural education for all ages."
      }
    ]
  };

  const ServiceCard = ({ service }: { service: any }) => (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary">{service.specialty}</Badge>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            {service.rating} ({service.reviews})
          </div>
        </div>
        <CardTitle className="text-lg">{service.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          {service.location}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">{service.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            {service.phone}
          </div>
          <div className="flex items-center text-sm">
            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            {service.languages.join(", ")}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">Contact</Button>
          <Button size="sm" variant="outline">Details</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Local Services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find trusted Chinese-speaking professionals and services across the UK. 
              From legal advice to healthcare, education, and financial planning.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search services or location..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="default">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="legal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="legal">Legal Services</TabsTrigger>
            <TabsTrigger value="medical">Healthcare</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
          
          <TabsContent value="legal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.legal.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="medical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.medical.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="financial">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.financial.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="education">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.education.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-6">
            We're constantly adding new service providers to our directory. 
            Let us know what services you need in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button>Request a Service</Button>
            <Button variant="outline">List Your Business</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;