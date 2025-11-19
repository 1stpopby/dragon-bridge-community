import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Eye, EyeOff, Briefcase, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  specialty: string;
  category: string;
  description: string | null;
  location: string;
  phone: string | null;
  email: string | null;
  years_experience: number | null;
  has_cscs: boolean | null;
  right_to_work: boolean | null;
  valid_from: string | null;
  listing_type: string | null;
  is_active: boolean;
  created_at: string;
}

const MyServices = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyServices();
    }
  }, [user]);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca serviciile tale.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceVisibility = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev =>
        prev.map(service =>
          service.id === serviceId
            ? { ...service, is_active: !currentStatus }
            : service
        )
      );

      toast({
        title: "Succes",
        description: `Anunțul a fost ${!currentStatus ? 'activat' : 'ascuns'}.`,
      });
    } catch (error) {
      console.error('Error toggling service visibility:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza vizibilitatea anunțului.",
        variant: "destructive",
      });
    }
  };

  const selfEmployedServices = services.filter(s => s.listing_type === 'self_employed');
  const companyServices = services.filter(s => s.listing_type === 'company');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <p className="text-center text-muted-foreground">
            Trebuie să fii autentificat pentru a vizualiza această pagină.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Serviciile Mele</h1>
          <p className="text-muted-foreground text-lg">
            Gestionează anunțurile tale de servicii
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Se încarcă...</p>
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nu ai niciun serviciu listat încă.
              </p>
              <Button asChild>
                <a href="/services">Adaugă un serviciu</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Self-Employed Services */}
            {selfEmployedServices.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  Caut Muncă ({selfEmployedServices.length})
                </h2>
                <div className="grid gap-4">
                  {selfEmployedServices.map((service) => (
                    <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-semibold">{service.name}</h3>
                              <Badge variant="secondary">{service.specialty}</Badge>
                              {service.category && (
                                <Badge variant="outline">{service.category}</Badge>
                              )}
                              {!service.is_active && (
                                <Badge variant="destructive" className="gap-1">
                                  <EyeOff className="h-3 w-3" />
                                  Ascuns
                                </Badge>
                              )}
                            </div>

                            {service.description && (
                              <p className="text-muted-foreground mb-4">{service.description}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{service.location}</span>
                              </div>
                              {service.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{service.phone}</span>
                                </div>
                              )}
                              {service.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span>{service.email}</span>
                                </div>
                              )}
                              {service.years_experience && (
                                <div className="text-muted-foreground">
                                  Experiență: {service.years_experience} ani
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-4">
                              {service.has_cscs && <Badge variant="outline">CSCS</Badge>}
                              {service.right_to_work && <Badge variant="outline">Right to Work</Badge>}
                              {service.valid_from && (
                                <Badge variant="outline">
                                  Valabil din: {format(new Date(service.valid_from), 'dd MMM yyyy', { locale: ro })}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {service.is_active ? 'Vizibil' : 'Ascuns'}
                              </span>
                              <Switch
                                checked={service.is_active}
                                onCheckedChange={() => toggleServiceVisibility(service.id, service.is_active)}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(service.created_at), 'dd MMM yyyy', { locale: ro })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Company Services */}
            {companyServices.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Angajăm ({companyServices.length})
                </h2>
                <div className="grid gap-4">
                  {companyServices.map((service) => (
                    <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-semibold">{service.name}</h3>
                              <Badge variant="secondary">{service.specialty}</Badge>
                              {service.category && (
                                <Badge variant="outline">{service.category}</Badge>
                              )}
                              {!service.is_active && (
                                <Badge variant="destructive" className="gap-1">
                                  <EyeOff className="h-3 w-3" />
                                  Ascuns
                                </Badge>
                              )}
                            </div>

                            {service.description && (
                              <p className="text-muted-foreground mb-4">{service.description}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{service.location}</span>
                              </div>
                              {service.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{service.phone}</span>
                                </div>
                              )}
                              {service.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span>{service.email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {service.is_active ? 'Vizibil' : 'Ascuns'}
                              </span>
                              <Switch
                                checked={service.is_active}
                                onCheckedChange={() => toggleServiceVisibility(service.id, service.is_active)}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(service.created_at), 'dd MMM yyyy', { locale: ro })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
};

export default MyServices;
