import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Download, ExternalLink, Search, FileText, Video, Globe, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ResourceDialog } from "@/components/ResourceDialog";
import { ResourceCard } from "@/components/ResourceCard";

const Resources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error loading resources",
        description: "Failed to load resources from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filterResources = (resourceList: any[], searchTerm: string, resourceType?: string) => {
    let filtered = resourceList;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (resourceType) {
      filtered = filtered.filter(resource => resource.resource_type === resourceType);
    }

    return filtered;
  };

  const guides = filterResources(resources, searchTerm, 'guide');
  const documents = filterResources(resources, searchTerm, 'document');
  const videos = filterResources(resources, searchTerm, 'video');
  const websites = filterResources(resources, searchTerm, 'website');

  const allGuides = [...guides, ...documents];

  // Calculate stats
  const totalResources = resources.length;
  const totalDownloads = resources.reduce((sum, resource) => sum + (resource.download_count || 0), 0);
  const totalViews = resources.reduce((sum, resource) => sum + (resource.view_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Resources & Guides
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to successfully navigate life in the UK. From healthcare 
              and housing to education and employment - we've got you covered.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalResources}</div>
              <div className="text-sm text-muted-foreground">Total Resources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalDownloads.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalViews.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ResourceDialog onResourceSaved={fetchResources} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="guides" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="guides">
              Guides & Documents ({allGuides.length})
            </TabsTrigger>
            <TabsTrigger value="videos">
              Video Resources ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="websites">
              Useful Websites ({websites.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guides">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading resources...</p>
              </div>
            ) : allGuides.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No guides match your search.' : 'No guides available yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allGuides.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onResourceChanged={fetchResources}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="videos">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No videos match your search.' : 'No videos available yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onResourceChanged={fetchResources}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="websites">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading websites...</p>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No websites match your search.' : 'No websites available yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {websites.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onResourceChanged={fetchResources}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Resources;