import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Trash2, MessageCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceDialog } from "./MarketplaceDialog";

interface MarketplaceCardProps {
  item: any;
  onItemChanged: () => void;
  showActions?: boolean;
}

export function MarketplaceCard({ item, onItemChanged, showActions = true }: MarketplaceCardProps) {
  const [loading, setLoading] = useState(false);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    inquirer_name: '',
    inquirer_contact: '',
    message: ''
  });
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item deleted successfully",
        description: "The item has been removed from the marketplace.",
      });

      onItemChanged();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error deleting item",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInquiry = async () => {
    if (!inquiryData.inquirer_name.trim() || !inquiryData.inquirer_contact.trim() || !inquiryData.message.trim()) {
      toast({
        title: "All fields required",
        description: "Please fill in all fields to send your inquiry.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_inquiries')
        .insert([{
          item_id: item.id,
          ...inquiryData
        }]);

      if (error) throw error;

      toast({
        title: "Inquiry sent successfully!",
        description: "The seller will be notified of your interest.",
      });

      setInquiryDialogOpen(false);
      setInquiryData({
        inquirer_name: '',
        inquirer_contact: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast({
        title: "Error sending inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols = { GBP: '£', EUR: '€', USD: '$' };
    return `${symbols[currency as keyof typeof symbols] || currency} ${price.toFixed(2)}`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'default';
      case 'like_new': return 'secondary';
      case 'good': return 'outline';
      case 'fair': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'reserved': return 'secondary';
      case 'sold': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={getConditionColor(item.condition)}>
            {item.condition.replace('_', ' ')}
          </Badge>
          <Badge variant={getStatusColor(item.status)}>
            {item.status}
          </Badge>
        </div>
        <CardTitle className="text-lg">{item.title}</CardTitle>
        <div className="text-2xl font-bold text-primary">
          {formatPrice(item.price, item.currency)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          {item.location}
        </div>
      </CardHeader>
      <CardContent>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {item.description}
          </p>
        )}
        
        <div className="text-xs text-muted-foreground mb-4">
          <div>Category: {item.category}</div>
          <div>Seller: {item.seller_name}</div>
        </div>
        
        {showActions && item.status === 'available' ? (
          <div className="flex gap-2">
            <Dialog open={inquiryDialogOpen} onOpenChange={setInquiryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact Seller</DialogTitle>
                  <DialogDescription>
                    Send an inquiry about "{item.title}" to {item.seller_name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inquirer_name">Your Name</Label>
                    <Input
                      id="inquirer_name"
                      value={inquiryData.inquirer_name}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, inquirer_name: e.target.value }))}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inquirer_contact">Your Contact Info</Label>
                    <Input
                      id="inquirer_contact"
                      value={inquiryData.inquirer_contact}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, inquirer_contact: e.target.value }))}
                      placeholder="Email or phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={inquiryData.message}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Your message to the seller..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setInquiryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInquiry} disabled={loading}>
                      {loading ? 'Sending...' : 'Send Inquiry'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <MarketplaceDialog
              item={item}
              onItemSaved={onItemChanged}
              mode="edit"
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{item.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button className="w-full" disabled={item.status !== 'available'}>
            {item.status === 'available' ? (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </>
            ) : (
              item.status === 'sold' ? 'Sold' : 'Reserved'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}