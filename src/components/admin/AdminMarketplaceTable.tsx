import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Trash2, 
  Edit, 
  Search, 
  Store,
  AlertCircle,
  MapPin,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminMarketplaceTableProps {
  onDataChange: () => void;
}

export const AdminMarketplaceTable = ({ onDataChange }: AdminMarketplaceTableProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      toast({
        title: "Error loading items",
        description: "Failed to load marketplace items data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item deleted",
        description: "The marketplace item has been successfully deleted.",
      });

      fetchItems();
      onDataChange();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error deleting item",
        description: "Failed to delete the marketplace item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleItemStatus = async (itemId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'available' ? 'sold' : 'available';
      
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status: newStatus })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item status updated",
        description: `Item status changed to ${newStatus}.`,
      });

      fetchItems();
      onDataChange();
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error updating status",
        description: "Failed to update item status. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading marketplace items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Marketplace Management ({filteredItems.length})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Listed</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Store className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No items match your search' : 'No marketplace items found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{item.title}</p>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.seller_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {formatPrice(Number(item.price), item.currency)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.condition}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleItemStatus(item.id, item.status)}
                      >
                        <Badge variant={item.status === 'available' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => window.open('/marketplace', '_blank')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                                Delete Marketplace Item
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"? This action cannot be undone and will also delete all inquiries for this item.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteItem(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};