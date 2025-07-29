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
import { MapPin, Trash2, MessageCircle, Package, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MarketplaceDialog } from "./MarketplaceDialog";
import { FullAdDialog } from "./FullAdDialog";
import MarketplaceLocationMap from "./MarketplaceLocationMap";

interface MarketplaceCardProps {
  item: any;
  onItemChanged: () => void;
  showActions?: boolean;
}

export function MarketplaceCard({ item, onItemChanged, showActions = true }: MarketplaceCardProps) {
  const [loading, setLoading] = useState(false);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [fullAdOpen, setFullAdOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    inquirer_name: '',
    inquirer_contact: '',
    message: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if current user is the owner of this item
  const isOwner = user && item.user_id === user.id;

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

  const handleMarkAsSold = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status: 'sold' })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item marked as sold",
        description: "The item has been marked as sold and removed from active listings.",
      });

      onItemChanged();
    } catch (error) {
      console.error('Error marking item as sold:', error);
      toast({
        title: "Error updating item",
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
    <>
      <div 
        className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-background cursor-pointer"
        onClick={() => setFullAdOpen(true)}
      >
        <div className="flex gap-4">
          {/* Image Section */}
          <div className="w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate mb-1">
                  {item.title}
                </h3>
                <div className="text-2xl font-bold text-primary mb-2">
                  {formatPrice(item.price, item.currency)}
                </div>
              </div>
              <div className="flex flex-col gap-1 ml-4">
                <Badge variant={getConditionColor(item.condition)} className="text-xs">
                  {item.condition.replace('_', ' ')}
                </Badge>
                <Badge variant={getStatusColor(item.status)} className="text-xs">
                  {item.status}
                </Badge>
              </div>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{item.location.split(',').slice(-2, -1)[0]?.trim() || item.location}</span>
                </div>
                <div>Category: {item.category}</div>
                <div>Seller: {item.seller_name}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <MarketplaceLocationMap 
                    location={item.location} 
                    title={item.title}
                  />
                </div>
              </div>

              {/* Actions Section */}
              {showActions ? (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {isOwner ? (
                    // Owner actions
                    <>
                      {item.status === 'available' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="default">
                              <Check className="h-4 w-4 mr-1" />
                              Mark as Sold
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark as Sold</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark "{item.title}" as sold? This will remove it from active listings.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleMarkAsSold}>
                                Mark as Sold
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {item.status === 'available' && (
                        <MarketplaceDialog
                          item={item}
                          onItemSaved={onItemChanged}
                          mode="edit"
                        />
                      )}
                      
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
                    </>
                  ) : (
                    // Non-owner actions (only contact if available)
                    item.status === 'available' && (
                      <Dialog open={inquiryDialogOpen} onOpenChange={setInquiryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Contact
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
                    )
                  )}
                  
                  {/* Show status for non-available items */}
                  {!isOwner && item.status !== 'available' && (
                    <Button size="sm" disabled>
                      {item.status === 'sold' ? 'Sold' : 'Reserved'}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Full Ad Dialog */}
      <FullAdDialog 
        item={item}
        open={fullAdOpen}
        onOpenChange={setFullAdOpen}
        onItemChanged={onItemChanged}
      />
    </>
  );
}