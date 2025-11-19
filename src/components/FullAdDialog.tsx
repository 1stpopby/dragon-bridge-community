import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Package, MessageCircle, Calendar, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MarketplaceDialog } from "./MarketplaceDialog";

interface FullAdDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemChanged?: () => void;
}

export function FullAdDialog({ item, open, onOpenChange, onItemChanged }: FullAdDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    inquirer_name: '',
    inquirer_contact: '',
    message: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if current user is the owner of this item
  const isOwner = user && item.user_id === user.id;

  const handleInquiry = async () => {
    if (!inquiryData.inquirer_name.trim() || !inquiryData.inquirer_contact.trim() || !inquiryData.message.trim()) {
      toast({
        title: "Toate câmpurile sunt obligatorii",
        description: "Te rugăm să completezi toate câmpurile pentru a trimite mesajul.",
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
        title: "Mesaj trimis cu succes!",
        description: "Vânzătorul va fi notificat de interesul tău.",
      });

      setShowContactForm(false);
      setInquiryData({
        inquirer_name: '',
        inquirer_contact: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast({
        title: "Eroare la trimiterea mesajului",
        description: "Te rugăm să încerci din nou.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title}</DialogTitle>
          <DialogDescription>
            Listat de {item.seller_name} în {item.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Section */}
          <div className="w-full">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-64 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center border">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Price and Status */}
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-primary">
              {formatPrice(item.price, item.currency)}
            </div>
            <div className="flex gap-2">
              <Badge variant={getConditionColor(item.condition)} className="text-sm">
                {item.condition.replace('_', ' ')}
              </Badge>
              <Badge variant={getStatusColor(item.status)} className="text-sm">
                {item.status}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Descriere</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Detalii Produs</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Categorie:</span>
                  <span>{item.category}</span>
                </div>
                {item.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Locație:</span>
                    <span>{item.location}</span>
                  </div>
                )}
                {!item.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="italic">Locație nespecificată</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Listat:</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Informații Vânzător</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Nume:</span>
                  <span>{item.seller_name}</span>
                </div>
                {item.seller_contact && !item.seller_contact.includes('@') && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Telefon:</span>
                    <span className="break-all">{item.seller_contact}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Section */}
          {item.status === 'available' && (
            <div className="border-t pt-6">
              <div className="text-center">
                {isOwner ? (
                  // Owner sees Edit Item button
                  <MarketplaceDialog
                    item={item}
                    onItemSaved={onItemChanged}
                    mode="edit"
                  />
                ) : (
                  // Non-owner sees Contact Seller
                  <>
                    {!showContactForm ? (
                      <Button 
                        onClick={() => setShowContactForm(true)}
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contactează Vânzătorul
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Trimite Mesaj către Vânzător</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="inquirer_name">Numele Tău</Label>
                            <Input
                              id="inquirer_name"
                              value={inquiryData.inquirer_name}
                              onChange={(e) => setInquiryData(prev => ({ ...prev, inquirer_name: e.target.value }))}
                              placeholder="Introdu numele tău"
                            />
                          </div>
                          <div>
                            <Label htmlFor="inquirer_contact">Informații Contact</Label>
                            <Input
                              id="inquirer_contact"
                              value={inquiryData.inquirer_contact}
                              onChange={(e) => setInquiryData(prev => ({ ...prev, inquirer_contact: e.target.value }))}
                              placeholder="Email sau telefon"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="message">Mesaj</Label>
                          <Textarea
                            id="message"
                            value={inquiryData.message}
                            onChange={(e) => setInquiryData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Salut, sunt interesat de acest produs. Este încă disponibil?"
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowContactForm(false)}>
                            Anulează
                          </Button>
                          <Button onClick={handleInquiry} disabled={loading}>
                            {loading ? 'Se trimite...' : 'Trimite Mesaj'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}