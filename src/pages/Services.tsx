import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Globe, Star, Search, Filter, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ServiceContactDialog } from "@/components/ServiceContactDialog";
import { ServiceDetailsDialog } from "@/components/ServiceDetailsDialog";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";
import { ListBusinessDialog } from "@/components/ListBusinessDialog";

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("legal");
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error loading services",
        description: "Failed to load services from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filterServices = (category: string) => {
    return services.filter(service => {
      const matchesCategory = service.category === category;
      const matchesSearch = !searchTerm || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  };

  const ServiceCard = ({ service }: { service: any }) => (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{service.specialty}</Badge>
            {service.verified && (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {service.featured && (
              <Badge variant="destructive" className="text-xs">
                Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            {service.rating} ({service.reviews_count})
          </div>
        </div>
        <CardTitle className="text-lg">{service.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          {service.location}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{service.description}</p>
        
        <div className="space-y-2 mb-4">
          {service.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              {service.phone}
            </div>
          )}
          <div className="flex items-center text-sm">
            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            {service.languages?.join(", ") || "Contact for languages"}
          </div>
        </div>
        
        <div className="flex gap-2">
          <ServiceContactDialog
            service={service}
            triggerButton={
              <Button size="sm" className="flex-1">Contact</Button>
            }
          />
          <ServiceDetailsDialog
            service={service}
            triggerButton={
              <Button size="sm" variant="outline">Details</Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );

  const categoryCounts = {
    legal: filterServices('legal').length,
    medical: filterServices('medical').length,
    financial: filterServices('financial').length,
    education: filterServices('education').length,
  };

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="legal">
              Legal Services ({categoryCounts.legal})
            </TabsTrigger>
            <TabsTrigger value="medical">
              Healthcare ({categoryCounts.medical})
            </TabsTrigger>
            <TabsTrigger value="financial">
              Financial ({categoryCounts.financial})
            </TabsTrigger>
            <TabsTrigger value="education">
              Education ({categoryCounts.education})
            </TabsTrigger>
          </TabsList>
          
          {['legal', 'medical', 'financial', 'education'].map((category) => (
            <TabsContent key={category} value={category}>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading services...</p>
                </div>
              ) : filterServices(category).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No services match your search criteria.' : `No ${category} services found.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterServices(category).map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-6">
            We're constantly adding new service providers to our directory. 
            Let us know what services you need in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ServiceRequestDialog
              triggerButton={<Button>Request a Service</Button>}
            />
            <ListBusinessDialog
              triggerButton={<Button variant="outline">List Your Business</Button>}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;