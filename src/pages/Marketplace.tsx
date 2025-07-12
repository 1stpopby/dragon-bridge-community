import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceDialog } from "@/components/MarketplaceDialog";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { useToast } from "@/hooks/use-toast";

const Marketplace = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const { toast } = useToast();

  const categories = [
    "Electronics", "Furniture", "Clothing", "Books", 
    "Kitchen", "Sports", "Tools", "Other"
  ];

  const conditions = [
    "new", "like_new", "good", "fair", "poor"
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
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

  useEffect(() => {
    fetchItems();
  }, []);

  const filterItems = (itemList: any[], searchTerm: string, category: string, condition: string) => {
    let filtered = itemList;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const filteredItems = filterItems(items, searchTerm, categoryFilter, conditionFilter);
  const availableItems = filteredItems.filter(item => item.status === 'available');
  const soldItems = filteredItems.filter(item => item.status === 'sold');

  // Calculate stats
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const uniqueSellers = new Set(items.map(item => item.seller_name)).size;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Community Marketplace
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Buy and sell items within our Chinese community. Find great deals, 
              discover unique items, and support fellow community members.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{availableItems.length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">£{totalValue.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{uniqueSellers}</div>
              <div className="text-sm text-muted-foreground">Active Sellers</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search items..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <MarketplaceDialog onItemSaved={fetchItems} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {conditions.map(condition => (
                    <SelectItem key={condition} value={condition}>
                      {condition.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="available">
              Available Items ({availableItems.length})
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold Items ({soldItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : availableItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== "all" || conditionFilter !== "all" 
                    ? 'No available items match your filters.' 
                    : 'No items available yet. List the first one!'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableItems.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    onItemChanged={fetchItems}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : soldItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sold items found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {soldItems.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    onItemChanged={fetchItems}
                    showActions={false}
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

export default Marketplace;