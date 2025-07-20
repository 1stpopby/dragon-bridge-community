import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
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
      
      // First fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (servicesError) throw servicesError;

      // Then fetch profile data for each service
      const servicesWithProfiles = await Promise.all(
        (servicesData || []).map(async (service) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, display_name, company_name')
            .eq('user_id', service.user_id)
            .single();

          return {
            ...service,
            profiles: profile
          };
        })
      );

      setServices(servicesWithProfiles);
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
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={service.profiles?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {(service.profiles?.company_name || service.profiles?.display_name || service.name).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-lg">{service.name}</h3>
                {service.verified && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {service.featured && (
                  <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {service.location}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
                  <span className="font-medium">{service.rating}</span>
                  <span className="text-muted-foreground">({service.reviews_count})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {service.description}
        </p>
        
        <div className="space-y-2 mb-4">
          {service.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">{service.phone}</span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <Globe className="h-4 w-4 mr-2 text-primary" />
            <span>{service.languages?.join(", ") || "English, Mandarin"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <ServiceContactDialog
            service={service}
            triggerButton={
              <Button size="sm" variant="outline" className="flex-1">
                Contact
              </Button>
            }
          />
          <ServiceDetailsDialog
            service={service}
            triggerButton={
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                Details
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      {/* Simplified Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">All Services ({services.length})</h1>
            </div>
            <div className="flex gap-2">
              <ServiceRequestDialog
                triggerButton={<Button size="sm" variant="outline">Request Service</Button>}
              />
              <ListBusinessDialog
                triggerButton={<Button size="sm">List Business</Button>}
              />
            </div>
          </div>
          
          <div className="relative">
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          {canViewServiceRequests && (
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all">Services</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
          )}
          
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
      <MobileNavigation />
    </div>
  );
};

export default Services;