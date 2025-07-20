import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, MapPin, Grid3X3, List, TrendingUp, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceDialog } from "@/components/MarketplaceDialog";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { FullAdDialog } from "@/components/FullAdDialog";
import { useToast } from "@/hooks/use-toast";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";

const Marketplace = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const conditions = [
    { value: "new", label: "New", color: "bg-green-100 text-green-800" },
    { value: "like_new", label: "Like New", color: "bg-emerald-100 text-emerald-800" },
    { value: "good", label: "Good", color: "bg-blue-100 text-blue-800" },
    { value: "fair", label: "Fair", color: "bg-yellow-100 text-yellow-800" },
    { value: "poor", label: "Poor", color: "bg-red-100 text-red-800" }
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error loading items",
        description: "Failed to load marketplace items from the database.",
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
        .eq('type', 'marketplace')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { name: "Electronics", icon: "💻" },
        { name: "Furniture", icon: "🪑" },
        { name: "Clothing", icon: "👕" },
        { name: "Books", icon: "📚" },
        { name: "Kitchen", icon: "🍳" },
        { name: "Sports", icon: "⚽" },
        { name: "Tools", icon: "🔧" },
        { name: "Other", icon: "📦" }
      ]);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const filterItems = (itemList: any[], searchTerm: string, locationTerm: string, category: string, condition: string) => {
    let filtered = itemList;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationTerm) {
      filtered = filtered.filter(item =>
        item.location.toLowerCase().includes(locationTerm.toLowerCase())
      );
    }

    if (category !== "all") {
      filtered = filtered.filter(item => item.category === category);
    }

    if (condition !== "all") {
      filtered = filtered.filter(item => item.condition === condition);
    }

    return filtered;
  };

  const filteredItems = filterItems(items, searchTerm, locationFilter, categoryFilter, conditionFilter);

  // Calculate stats
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const uniqueSellers = new Set(items.map(item => item.seller_name)).size;
  const averagePrice = totalItems > 0 ? totalValue / totalItems : 0;

  const formatPrice = (price: number, currency: string = 'GBP') => {
    const symbols = { GBP: '£', EUR: '€', USD: '$' };
    return `${symbols[currency as keyof typeof symbols] || currency}${price.toFixed(0)}`;
  };

  const getConditionColor = (condition: string) => {
    const conditionObj = conditions.find(c => c.value === condition);
    return conditionObj?.color || "bg-gray-100 text-gray-800";
  };

  const GridCard = ({ item }: { item: any }) => {
    const [fullAdOpen, setFullAdOpen] = useState(false);
    
    return (
      <>
        <Card 
          className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in cursor-pointer"
          onClick={() => setFullAdOpen(true)}
        >
          <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/50 to-muted relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                <Package className="h-16 w-16 text-primary/30" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge className={`${getConditionColor(item.condition)} border-0 font-medium`}>
                {item.condition.replace('_', ' ')}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(item.price, item.currency)}
                </span>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {item.description || "No description provided"}
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate">{item.location}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                by {item.seller_name}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <FullAdDialog 
          item={item}
          open={fullAdOpen}
          onOpenChange={setFullAdOpen}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Community Marketplace</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in">
            Discover Amazing Deals
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in">
            Buy and sell items within our vibrant community. Find unique treasures, 
            great bargains, and connect with fellow members.
          </p>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search by title, description, seller..." 
                    className="pl-12 h-12 border-0 bg-muted/50 focus:bg-background transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative lg:w-64">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Location, city, postcode..." 
                    className="pl-12 h-12 border-0 bg-muted/50 focus:bg-background transition-colors"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <MarketplaceDialog onItemSaved={fetchItems} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 border-0 bg-muted/50">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.name || category} value={category.name || category}>
                          <span className="flex items-center gap-2">
                            {category.icon && <span>{category.icon}</span>}
                            {category.name || category}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger className="w-40 border-0 bg-muted/50">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      {conditions.map(condition => (
                        <SelectItem key={condition.value} value={condition.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${condition.color.split(' ')[0]}`}></span>
                            {condition.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">View:</span>
                  <div className="flex border rounded-lg p-1 bg-muted/50">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <span className="text-lg">Loading amazing deals...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || locationFilter || categoryFilter !== "all" || conditionFilter !== "all" 
                ? 'Try adjusting your filters to see more results.' 
                : 'Be the first to list an item and start trading!'
              }
            </p>
            <MarketplaceDialog onItemSaved={fetchItems} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {filteredItems.length} Item{filteredItems.length !== 1 ? 's' : ''} Available
                </h2>
                <p className="text-muted-foreground">
                  Showing {filteredItems.length} of {totalItems} total items
                </p>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item, index) => (
                  <div key={`grid-${item.id}`} className="contents">
                    {/* Insert ad after 1st item, then every 4 items */}
                    {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                      <AdvertisementBanner 
                        location="marketplace" 
                        variant="card" 
                        maxAds={1}
                        className="h-full"
                      />
                    )}
                    <div
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <GridCard item={item} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item, index) => (
                  <div key={`list-${item.id}`}>
                    {/* Insert ad after 1st item, then every 4 items */}
                    {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                      <div className="mb-6">
                        <AdvertisementBanner 
                          location="marketplace" 
                          variant="card" 
                          maxAds={1}
                        />
                      </div>
                    )}
                    <div
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <MarketplaceCard
                        item={item}
                        onItemChanged={fetchItems}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
      <MobileNavigation />
    </div>
  );
};

export default Marketplace;