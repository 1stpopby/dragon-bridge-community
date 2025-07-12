import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Download, ExternalLink, Search, FileText, Video, Globe, Heart } from "lucide-react";

const Resources = () => {
  const guides = [
    {
      title: "Complete Guide to NHS Registration",
      description: "Step-by-step guide to registering with a GP, understanding NHS services, and accessing healthcare in the UK.",
      category: "Healthcare",
      downloadCount: 2450,
      type: "PDF Guide",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "UK Tax System for New Residents",
      description: "Understanding PAYE, National Insurance, tax codes, and filing requirements for Chinese residents.",
      category: "Finance",
      downloadCount: 1890,
      type: "PDF Guide", 
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "School Application Process",
      description: "Comprehensive guide to applying for primary and secondary schools, including admissions criteria.",
      category: "Education",
      downloadCount: 1650,
      type: "PDF Guide",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Renting Property in the UK",
      description: "Everything you need to know about finding accommodation, tenancy agreements, and tenant rights.",
      category: "Housing",
      downloadCount: 2100,
      type: "PDF Guide",
      icon: <FileText className="h-5 w-5" />
    }
  ];

  const videos = [
    {
      title: "Your First Day in the UK",
      description: "Essential tasks and tips for your first week after arriving in the UK.",
      category: "General",
      views: 8450,
      duration: "15 mins",
      icon: <Video className="h-5 w-5" />
    },
    {
      title: "Opening a UK Bank Account",
      description: "Step-by-step walkthrough of opening your first UK bank account.",
      category: "Finance",
      views: 6200,
      duration: "12 mins",
      icon: <Video className="h-5 w-5" />
    },
    {
      title: "Understanding UK Culture",
      description: "Cultural norms, social etiquette, and workplace culture in the UK.",
      category: "Culture",
      views: 5800,
      duration: "20 mins",
      icon: <Video className="h-5 w-5" />
    }
  ];

  const websites = [
    {
      title: "Gov.UK Official Portal",
      description: "Official government website for all UK services and information.",
      category: "Government",
      url: "https://gov.uk",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "NHS Online Services",
      description: "Access NHS services, book appointments, and manage your health online.",
      category: "Healthcare", 
      url: "https://nhs.uk",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "Citizens Advice",
      description: "Free, confidential advice on legal, financial, and consumer issues.",
      category: "Legal",
      url: "https://citizensadvice.org.uk",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "Rightmove Property Search",
      description: "UK's largest property portal for buying and renting homes.",
      category: "Housing",
      url: "https://rightmove.co.uk", 
      icon: <Globe className="h-5 w-5" />
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
              Resources & Guides
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to successfully navigate life in the UK. From healthcare 
              and housing to education and employment - we've got you covered.
            </p>
          </div>
          
          <div className="flex justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="guides" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="guides">Guides & Documents</TabsTrigger>
            <TabsTrigger value="videos">Video Resources</TabsTrigger>
            <TabsTrigger value="websites">Useful Websites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guides">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{guide.category}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Download className="h-4 w-4 mr-1" />
                        {guide.downloadCount}
                      </div>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {guide.icon}
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{guide.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{guide.type}</span>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{video.category}</Badge>
                      <span className="text-sm text-muted-foreground">{video.duration}</span>
                    </div>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{video.views} views</span>
                      <Button size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Watch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="websites">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {websites.map((website, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{website.category}</Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {website.icon}
                      {website.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{website.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-mono">{website.url}</span>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Resources;