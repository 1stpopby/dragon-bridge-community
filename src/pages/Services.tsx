import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Globe, Star, Search, Filter, CheckCircle, Users, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ServiceContactDialog } from "@/components/ServiceContactDialog";
import { ServiceDetailsDialog } from "@/components/ServiceDetailsDialog";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";
import { ListBusinessDialog } from "@/components/ListBusinessDialog";
import { ServiceRequestsTab } from "@/components/ServiceRequestsTab";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Check if user is a company or service provider who should see service requests
  const canViewServiceRequests = profile?.account_type === 'company' || 
    (user && services.some(service => service.user_id === user.id));

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

  const filterServices = () => {
    if (!searchTerm) return services;
    return services.filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const ServiceListItem = ({ service }: { service: any }) => (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={service.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {service.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{service.name}</h3>
                {service.verified && (
                  <Badge variant="secondary" className="text-xs">
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {service.location}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  {service.rating} ({service.reviews_count})
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {service.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            {service.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                {service.phone}
              </div>
            )}
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
              {service.languages?.join(", ") || "Contact for languages"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <ServiceContactDialog
            service={service}
            triggerButton={
              <Button size="sm" variant="outline">Contact</Button>
            }
          />
          <ServiceDetailsDialog
            service={service}
            triggerButton={
              <Button size="sm">
                Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advertisement Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdvertisementBanner 
          location="services" 
          variant="banner" 
          maxAds={1}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Action Buttons at Top */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <ServiceRequestDialog
            triggerButton={<Button>Request a Service</Button>}
          />
          <ListBusinessDialog
            triggerButton={<Button variant="outline">List Your Business</Button>}
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className={`grid w-full ${canViewServiceRequests ? 'grid-cols-2' : 'grid-cols-1'} mb-8`}>
            <TabsTrigger value="all">
              All Services ({services.length})
            </TabsTrigger>
            {canViewServiceRequests && (
              <TabsTrigger value="requests">
                Service Requests
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading services...</p>
              </div>
            ) : filterServices().length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No services match your search criteria.' : 'No services found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filterServices().map((service) => (
                  <ServiceListItem key={service.id} service={service} />
                ))}
              </div>
            )}
          </TabsContent>
          
          {canViewServiceRequests && (
            <TabsContent value="requests">
              <ServiceRequestsTab searchTerm={searchTerm} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Services;