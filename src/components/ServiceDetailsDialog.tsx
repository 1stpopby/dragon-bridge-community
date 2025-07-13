import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, Globe, Star, Clock, CheckCircle } from "lucide-react";
import { ServiceContactDialog } from "./ServiceContactDialog";

interface ServiceDetailsDialogProps {
  service: any;
  triggerButton: React.ReactNode;
}

export function ServiceDetailsDialog({ service, triggerButton }: ServiceDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  const formatBusinessHours = (hours: any) => {
    if (!hours) return "Contact for hours";
    // This is a placeholder - you could implement proper business hours formatting
    return "Mon-Fri: 9:00 AM - 6:00 PM";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{service.name}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {service.specialty}
              </DialogDescription>
            </div>
            {service.verified && (
              <Badge variant="default" className="ml-4">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating and Reviews */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="font-medium">{service.rating}</span>
              <span className="text-muted-foreground ml-1">
                ({service.reviews_count} reviews)
              </span>
            </div>
            <Badge variant="secondary">{service.category}</Badge>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">About</h4>
            <p className="text-muted-foreground">{service.description}</p>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h4 className="font-medium mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>{service.location}</span>
              </div>
              {service.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                  <a href={`tel:${service.phone}`} className="hover:underline">
                    {service.phone}
                  </a>
                </div>
              )}
              {service.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                  <a href={`mailto:${service.email}`} className="hover:underline">
                    {service.email}
                  </a>
                </div>
              )}
              {service.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-3 text-muted-foreground" />
                  <a 
                    href={service.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Languages */}
          <div>
            <h4 className="font-medium mb-3">Languages Spoken</h4>
            <div className="flex flex-wrap gap-2">
              {service.languages?.map((language: string, index: number) => (
                <Badge key={index} variant="outline">
                  {language}
                </Badge>
              ))}
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="font-medium mb-3">Business Hours</h4>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatBusinessHours(service.business_hours)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <ServiceContactDialog
              service={service}
              triggerButton={
                <Button className="flex-1">Contact Service</Button>
              }
            />
            {service.website && (
              <Button variant="outline" asChild>
                <a href={service.website} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}