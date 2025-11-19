import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import GoogleMap from './GoogleMap';
import { useGoogleMaps } from './GoogleMapsProvider';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: string;
  placeholder?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation = "",
  placeholder = "Enter location or click on map"
}) => {
  const [address, setAddress] = useState(initialLocation);
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 });
  const [showMap, setShowMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'GB' }
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || address;
            
            setAddress(formattedAddress);
            setMapCenter({ lat, lng });
            onLocationSelect({ lat, lng, address: formattedAddress });
          }
        });
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }
  }, [isLoaded, address, onLocationSelect]);

  const handleSearch = async () => {
    if (!address.trim() || !isLoaded) return;

    setIsSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: address + ', UK' }, (results, status) => {
        setIsSearching(false);
        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          const formattedAddress = results[0].formatted_address;
          
          setMapCenter({ lat, lng });
          setAddress(formattedAddress);
          onLocationSelect({ lat, lng, address: formattedAddress });
        } else {
          console.error('Geocoding failed:', status);
        }
      });
    } catch (error) {
      setIsSearching(false);
      console.error('Error geocoding address:', error);
    }
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setAddress(location.address);
    setMapCenter({ lat: location.lat, lng: location.lng });
    onLocationSelect(location);
  };

  const handleManualInput = (value: string) => {
    setAddress(value);
    // Update parent component with manually typed address
    onLocationSelect({ lat: mapCenter.lat, lng: mapCenter.lng, address: value });
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={address}
              onChange={(e) => handleManualInput(e.target.value)}
              placeholder={placeholder}
              className="pl-10"
            />
          </div>
        </div>
        <div className="text-sm text-destructive">
          Google Maps failed to load. You can still enter a location manually.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            value={address}
            onChange={(e) => handleManualInput(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={!isLoaded}
          />
        </div>
        <Button 
          type="button"
          variant="outline" 
          size="icon" 
          onClick={handleSearch}
          disabled={!isLoaded || isSearching || !address.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isLoaded && !loadError && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading Google Maps...
        </div>
      )}

      {isLoaded && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMap(!showMap)}
          className="w-full"
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
      )}

      {showMap && isLoaded && (
        <div className="border rounded-lg overflow-hidden">
          <GoogleMap
            center={mapCenter}
            zoom={14}
            height="300px"
            onLocationSelect={handleMapLocationSelect}
            markers={address ? [{
              position: mapCenter,
              title: address,
              info: address
            }] : []}
          />
        </div>
      )}
    </div>
  );
};

export default LocationPicker;