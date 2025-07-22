import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostCard from "@/components/PostCard";
import EventCard from "@/components/EventCard";
import CompanyServicesTab from "@/components/CompanyServicesTab";
import CompanyGalleryTab from "@/components/CompanyGalleryTab";
import CompanyFeedbackTab from "@/components/CompanyFeedbackTab";
import { 
  Building2, 
  Globe, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Loader2,
  Mail,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CompanyProfile {
  id: string;
  user_id: string;
  display_name: string;
  company_name: string;
  company_description: string | null;
  company_website: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_services: string[] | null;
  company_founded: string | null;
  company_size: string | null;
  company_cover_image: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  location: string | null;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked?: boolean;
}

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string;
  category: string;
  image_url: string | null;
  author_name: string;
  attendees: number;
}

const CompanyProfile = () => {
  const { companyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company profile
      const { data: companyData, error: companyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', companyId)
        .eq('account_type', 'company')
        .single();

      if (companyError) throw companyError;
      
      if (!companyData) {
        setLoading(false);
        return;
      }

      setCompany(companyData);

      // Fetch company posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', companyData.user_id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch company events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', companyData.user_id)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error loading company profile",
        description: "Failed to load company information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/404" replace />;
  }

  const initials = company.company_name
    ? company.company_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : company.display_name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Cover Image Section */}
        <div className="relative w-full h-80 mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/50">
          {company.company_cover_image ? (
            <>
              <img
                src={company.company_cover_image}
                alt="Company cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground/70">
                  {company.company_name || company.display_name}
                </p>
                <p className="text-sm text-muted-foreground/50 mt-2">No cover image set</p>
              </div>
            </div>
          )}
        </div>

        {/* Company Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32 ring-4 ring-background shadow-2xl">
                <AvatarImage src={company.avatar_url || undefined} alt={company.company_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-primary/20">
                  <Building2 className="h-3 w-3 mr-1 text-primary" />
                  Company
                </Badge>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {company.company_name || company.display_name}
                </h1>
                {user && user.id === company.user_id && (
                  <Link to="/profile">
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
              
              {company.company_description && (
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  {company.company_description}
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {company.company_website && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Website</p>
                      <a href={company.company_website} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline font-medium">
                        {company.company_website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                
                {company.contact_email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <a href={`mailto:${company.contact_email}`} className="text-primary hover:underline font-medium">
                        {company.contact_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {company.company_phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                      <span className="font-medium">{company.company_phone}</span>
                    </div>
                  </div>
                )}
                
                {company.company_address && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Address</p>
                      <span className="font-medium">{company.company_address}</span>
                    </div>
                  </div>
                )}
                
                {company.company_founded && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Founded</p>
                      <span className="font-medium">{new Date(company.company_founded).getFullYear()}</span>
                    </div>
                  </div>
                )}
                
                {company.company_size && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Team Size</p>
                      <span className="font-medium">{company.company_size} employees</span>
                    </div>
                  </div>
                )}
              </div>

              {company.company_services && company.company_services.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Services Offered</p>
                  <div className="flex flex-wrap gap-2">
                    {company.company_services.map((service, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6 mt-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-6 mt-6">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No events yet</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onEventChanged={() => fetchCompanyData()}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <CompanyServicesTab 
              companyId={company.id} 
              isOwner={user?.id === company.user_id}
            />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <CompanyGalleryTab 
              companyId={company.id} 
              isOwner={user?.id === company.user_id}
            />
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <CompanyFeedbackTab 
              companyId={company.id} 
              isOwner={user?.id === company.user_id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanyProfile;