import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Building2, X, Eye, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_type: 'external' | 'company';
  external_link: string | null;
  company_id: string | null;
  placement_locations: string[];
  status: 'draft' | 'active' | 'paused' | 'expired';
  priority: number;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AdvertisementBannerProps {
  location: 'home' | 'forum' | 'events' | 'services' | 'marketplace' | 'feed';
  variant?: 'banner' | 'card' | 'inline' | 'post';
  maxAds?: number;
  className?: string;
}

export function AdvertisementBanner({ 
  location, 
  variant = 'banner', 
  maxAds = 1,
  className = "" 
}: AdvertisementBannerProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedAds, setViewedAds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdvertisements();
  }, [location]);

  // Track views when advertisements are displayed (only once per ad)
  useEffect(() => {
    if (advertisements.length > 0) {
      const newAds = advertisements.filter(ad => !viewedAds.includes(ad.id));
      if (newAds.length > 0) {
        const adIds = newAds.map(ad => ad.id);
        setViewedAds(prev => [...prev, ...adIds]);
        trackViews(adIds);
      }
    }
  }, [advertisements.map(ad => ad.id).join(',')]);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('status', 'active')
        .contains('placement_locations', [location])
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(maxAds);

      if (error) {
        // If table doesn't exist or access denied, silently fail
        if (error.message?.includes('relation') || error.message?.includes('permission')) {
          console.log('Advertisements table not available, skipping ads');
          setAdvertisements([]);
          return;
        }
        throw error;
      }

      // Filter out dismissed ads
      const filteredAds = (data || []).filter(ad => !dismissedAds.includes(ad.id));
      setAdvertisements(filteredAds as Advertisement[]);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      // Set empty array to prevent loading forever
      setAdvertisements([]);
    } finally {
      setLoading(false);
    }
  };

  const trackViews = async (adIds: string[]) => {
    if (adIds.length === 0) return;
    
    try {
      for (const adId of adIds) {
        // Get current view count and increment it
        const { data: currentAd } = await supabase
          .from('advertisements')
          .select('view_count')
          .eq('id', adId)
          .single();
        
        if (currentAd) {
          await supabase
            .from('advertisements')
            .update({ view_count: (currentAd.view_count || 0) + 1 })
            .eq('id', adId);
        }
      }
    } catch (error) {
      // Silently fail - analytics aren't critical
      console.log('Could not track ad views');
    }
  };

  const trackClick = async (adId: string) => {
    if (!adId) return;
    
    try {
      // Get current click count and increment it
      const { data: currentAd } = await supabase
        .from('advertisements')
        .select('click_count')
        .eq('id', adId)
        .single();
      
      if (currentAd) {
        await supabase
          .from('advertisements')
          .update({ click_count: (currentAd.click_count || 0) + 1 })
          .eq('id', adId);
        
        // Update local state to reflect new click count
        setAdvertisements(prev => prev.map(ad => 
          ad.id === adId 
            ? { ...ad, click_count: (ad.click_count || 0) + 1 }
            : ad
        ));
      }
    } catch (error) {
      // Silently fail - analytics aren't critical
      console.log('Could not track ad click');
    }
  };

  const handleAdClick = (ad: Advertisement) => {
    trackClick(ad.id);
    
    if (ad.link_type === 'external' && ad.external_link) {
      window.open(ad.external_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismiss = (adId: string) => {
    setDismissedAds(prev => [...prev, adId]);
    setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
  };

  const renderPostAd = (ad: Advertisement) => (
    <Card key={ad.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm overflow-hidden group">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10 transition-all group-hover:ring-primary/20">
                  <AvatarImage src={ad.image_url || undefined} alt={ad.title} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-semibold">
                    <Star className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-lg">
                  AD
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                    {ad.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                    <Star className="h-3 w-3 mr-1" />
                    Sponsored
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Promoted content</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">Sponsored</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(ad.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {ad.description}
            </p>
            
            {ad.image_url && (
              <div className="rounded-xl overflow-hidden bg-muted/20 shadow-lg">
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full max-h-96 object-cover transition-transform hover:scale-105 duration-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Post Actions */}
        <div className="px-6 py-4 mt-4">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {ad.link_type === 'external' ? (
                <Button
                  onClick={() => handleAdClick(ad)}
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-medium">Learn More</span>
                </Button>
              ) : (
                <Button
                  asChild
                  onClick={() => trackClick(ad.id)}
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link to={`/company/${ad.company_id}`}>
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">View Profile</span>
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{ad.view_count || 0} views</span>
              <span>•</span>
              <span>{ad.click_count || 0} clicks</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderBannerAd = (ad: Advertisement) => (
    <Card key={ad.id} className={`relative group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-accent/5 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-0 relative z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-start space-x-6 flex-1">
            {ad.image_url && (
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl blur-sm opacity-50" />
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-white/20 shadow-lg relative z-10"
                />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {ad.title}
                </h3>
                <Badge variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                  <span className="flex items-center gap-1">
                    ✨ Sponsored
                  </span>
                </Badge>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed">{ad.description}</p>
              <div className="flex items-center space-x-3 pt-2">
                {ad.link_type === 'external' ? (
                  <Button
                    size="default"
                    onClick={() => handleAdClick(ad)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span>Learn More</span>
                  </Button>
                ) : (
                  <Button
                    size="default"
                    asChild
                    onClick={() => trackClick(ad.id)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Link to={`/company/${ad.company_id}`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>View Profile</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(ad.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCardAd = (ad: Advertisement) => {
    // For marketplace location, use the same layout as MarketplaceCard
    if (location === 'marketplace') {
      return (
        <div 
          key={ad.id}
          className={`border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-background cursor-pointer ${className}`}
          onClick={() => handleAdClick(ad)}
        >
          <div className="flex gap-4">
            {/* Image Section - same as marketplace card */}
            <div className="w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {ad.image_url ? (
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Star className="h-8 w-8 text-amber-500" />
                </div>
              )}
            </div>

            {/* Content Section - same structure as marketplace card */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate mb-1">
                    {ad.title}
                  </h3>
                  <div className="text-lg font-bold text-amber-600 mb-2">
                    Sponsored Content
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-4">
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800">
                    ✨ AD
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(ad.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 hover:text-red-600 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {ad.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div>Promoted Content</div>
                </div>

                <div className="flex gap-2">
                  {ad.link_type === 'external' ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdClick(ad);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Learn More
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      asChild
                      onClick={() => trackClick(ad.id)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      <Link to={`/company/${ad.company_id}`}>
                        <Building2 className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default card layout for other locations
    return (
      <Card key={ad.id} className={`relative group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-background to-accent/5 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative z-10">
          {ad.image_url && (
            <div className="mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-sm opacity-50" />
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-40 rounded-lg object-cover border-2 border-white/20 shadow-lg relative z-10"
              />
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                <span className="flex items-center gap-1">
                  ✨ Sponsored
                </span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(ad.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {ad.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{ad.description}</p>
            <div className="pt-3">
              {ad.link_type === 'external' ? (
                <Button
                  size="default"
                  onClick={() => handleAdClick(ad)}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span>Learn More</span>
                </Button>
              ) : (
                <Button
                  size="default"
                  asChild
                  onClick={() => trackClick(ad.id)}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link to={`/company/${ad.company_id}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>View Profile</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInlineAd = (ad: Advertisement) => (
    <div key={ad.id} className={`relative group ${className}`}>
      <Card className="border-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {ad.image_url && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-sm opacity-50" />
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-white/20 shadow-md relative z-10 flex-shrink-0"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {ad.title}
                  </h4>
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200">
                    <span className="flex items-center gap-1">
                      ✨ Sponsored
                    </span>
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{ad.description}</p>
                <div className="pt-1">
                  {ad.link_type === 'external' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdClick(ad)}
                      className="text-sm h-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 hover:border-primary/30 transition-all duration-300"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Learn More
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      onClick={() => trackClick(ad.id)}
                      className="text-sm h-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 hover:border-primary/30 transition-all duration-300"
                    >
                      <Link to={`/company/${ad.company_id}`}>
                        <Building2 className="h-3 w-3 mr-1" />
                        View Profile
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(ad.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1 h-8 w-8 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading || advertisements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {advertisements.map((ad) => {
        switch (variant) {
          case 'post':
            return renderPostAd(ad);
          case 'card':
            return renderCardAd(ad);
          case 'inline':
            return renderInlineAd(ad);
          default:
            return renderBannerAd(ad);
        }
      })}
    </div>
  );
} 