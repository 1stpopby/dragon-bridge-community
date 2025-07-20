import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import GoogleMap from './GoogleMap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MarketplaceLocationMapProps {
  location: string;
  title: string;
}

const MarketplaceLocationMap: React.FC<MarketplaceLocationMapProps> = ({
  location,
  title
}) => {
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 });
  const [isGeocoded, setIsGeocoded] = useState(false);

  const geocodeLocation = async () => {
    if (isGeocoded) return;

    try {
      // Make sure Google Maps API is loaded
      if (!window.google) {
        console.error('Google Maps API not loaded');
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: location + ', UK' }, (results, status) => {
        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          setMapCenter({ lat, lng });
          setIsGeocoded(true);
        } else {
          console.error('Geocoding failed:', status);
        }
      });
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={geocodeLocation}
        >
          <MapPin className="h-3 w-3" />
          View on Map
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Location: {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{location}</p>
          <GoogleMap
            center={mapCenter}
            zoom={15}
            height="400px"
            markers={[{
              position: mapCenter,
              title: title,
              info: `<div><strong>${title}</strong><br/>${location}</div>`
            }]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceLocationMap;