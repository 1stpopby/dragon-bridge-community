import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Mail, Search, CheckCircle, Calendar, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SelfEmployedListingDialog } from "@/components/SelfEmployedListingDialog";
import { CompanyJobListingDialog } from "@/components/CompanyJobListingDialog";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const Services = () => {
  const [selfEmployedListings, setSelfEmployedListings] = useState<any[]>([]);
  const [companyJobs, setCompanyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("self-employed");
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      // Fetch self-employed listings
      const { data: selfEmployedData, error: selfError } = await supabase
        .from('services')
        .select('*')
        .eq('listing_type', 'self_employed')
        .order('created_at', { ascending: false });

      if (selfError) throw selfError;

      // Fetch company job listings
      const { data: companyData, error: companyError } = await supabase
        .from('services')
        .select('*')
        .eq('listing_type', 'company')
        .order('created_at', { ascending: false });

      if (companyError) throw companyError;

      // Fetch profiles for all listings
      const allListings = [...(selfEmployedData || []), ...(companyData || [])];
      const listingsWithProfiles = await Promise.all(
        allListings.map(async (listing) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, avatar_url, display_name, company_name, account_type')
            .eq('user_id', listing.user_id)
            .single();

          return {
            ...listing,
            profiles: profile
          };
        })
      );

      setSelfEmployedListings(listingsWithProfiles.filter(l => l.listing_type === 'self_employed'));
      setCompanyJobs(listingsWithProfiles.filter(l => l.listing_type === 'company'));
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Eroare la încărcarea anunțurilor",
        description: "Nu s-au putut încărca anunțurile din baza de date.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .in('type', ['service', 'service_self_employed'])
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getFilteredCategories = () => {
    if (activeTab === 'self-employed') {
      return categories.filter(cat => cat.type === 'service_self_employed');
    } else {
      return categories.filter(cat => cat.type === 'service');
    }
  };

  const filterListings = (listings: any[]) => {
    let filtered = listings;
    
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.category === categoryFilter);
    }

    return filtered;
  };

  useEffect(() => {
    fetchListings();
    fetchCategories();
  }, []);

  const SelfEmployedCard = ({ listing }: { listing: any }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={listing.profiles?.avatar_url || ""} />
            <AvatarFallback>{listing.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{listing.name}</h3>
              <p className="text-lg text-primary font-medium">{listing.specialty}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {listing.has_cscs && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  CSCS
                </Badge>
              )}
              {listing.right_to_work && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Right to Work
                </Badge>
              )}
              {listing.years_experience > 0 && (
                <Badge variant="secondary">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {listing.years_experience} ani experiență
                </Badge>
              )}
              {listing.valid_from && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Valabil din {format(new Date(listing.valid_from), 'MMM yyyy', { locale: ro })}
                </Badge>
              )}
            </div>

            {listing.description && (
              <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>
              {listing.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{listing.phone}</span>
                </div>
              )}
              {listing.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{listing.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CompanyJobCard = ({ listing }: { listing: any }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={listing.profiles?.avatar_url || ""} />
            <AvatarFallback>{listing.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{listing.name}</h3>
              <p className="text-lg text-primary font-medium">Căutăm: {listing.specialty}</p>
            </div>

            {listing.category && (
              <Badge variant="outline">{listing.category}</Badge>
            )}

            {listing.description && (
              <p className="text-muted-foreground line-clamp-3">{listing.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>
              {listing.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{listing.phone}</span>
                </div>
              )}
              {listing.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{listing.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Servicii & Angajări</h1>
          <p className="text-muted-foreground text-lg">
            Găsește profesioniști sau postează anunțuri de angajare
          </p>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Caută după nume, specializare, locație..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toate categoriile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate categoriile</SelectItem>
                {getFilteredCategories().map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs 
          defaultValue="self-employed" 
          className="w-full"
          onValueChange={(value) => {
            setActiveTab(value);
            setCategoryFilter("all");
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="self-employed">
              Caut Muncă ({filterListings(selfEmployedListings).length})
            </TabsTrigger>
            <TabsTrigger value="companies">
              Angajăm ({filterListings(companyJobs).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="self-employed" className="space-y-6">
            <div className="flex justify-end mb-4">
              <SelfEmployedListingDialog
                triggerButton={
                  <Button>
                    Adaugă Anunț - Caut Muncă
                  </Button>
                }
              />
            </div>

            {loading ? (
              <div className="text-center py-12">Se încarcă...</div>
            ) : filterListings(selfEmployedListings).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Nu există anunțuri de persoane care caută muncă.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterListings(selfEmployedListings).map((listing) => (
                  <SelfEmployedCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <div className="flex justify-end mb-4">
              <CompanyJobListingDialog
                triggerButton={
                  <Button disabled={profile?.account_type !== 'company'}>
                    Angajăm
                  </Button>
                }
              />
            </div>

            {loading ? (
              <div className="text-center py-12">Se încarcă...</div>
            ) : filterListings(companyJobs).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Nu există anunțuri de angajare.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterListings(companyJobs).map((listing) => (
                  <CompanyJobCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
};

export default Services;
