import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import { MarketplaceCard } from "@/components/MarketplaceCard";

const MyMarketplace = () => {
  const { user } = useAuth();
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [soldItems, setSoldItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMarketplaceItems();
    }
  }, [user]);

  const fetchMarketplaceItems = async () => {
    if (!user) return;

    try {
      // Fetch active items
      const { data: activeData, error: activeError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;
      setActiveItems(activeData || []);

      // Fetch sold items
      const { data: soldData, error: soldError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .order('created_at', { ascending: false });

      if (soldError) throw soldError;
      setSoldItems(soldData || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Marketplace</h1>
            <p className="text-muted-foreground">Manage your listings and track your sales</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Active Items */}
          <Card>
            <CardHeader>
              <CardTitle>Active Listings ({activeItems.length})</CardTitle>
              <CardDescription>
                Your items currently available for sale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No active listings</p>
                  <p className="text-sm">Start selling by creating your first listing in the marketplace</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <MarketplaceCard
                      key={item.id}
                      item={item}
                      onItemChanged={fetchMarketplaceItems}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sold Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sold Items ({soldItems.length})</CardTitle>
              <CardDescription>
                Your items that have been sold
              </CardDescription>
            </CardHeader>
            <CardContent>
              {soldItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No sold items yet</p>
                  <p className="text-sm">Items you mark as sold will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {soldItems.map((item) => (
                    <MarketplaceCard
                      key={item.id}
                      item={item}
                      onItemChanged={fetchMarketplaceItems}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <MobileNavigation />
    </div>
  );
};

export default MyMarketplace;