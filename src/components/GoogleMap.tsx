import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    info?: string;
  }>;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = { lat: 51.5074, lng: -0.1278 }, // Default to London
  zoom = 10,
  height = "400px",
  markers = [],
  onLocationSelect,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markersArray, setMarkersArray] = useState<google.maps.Marker[]>([]);
  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMap(mapInstance);

      // Add click listener for location selection
      if (onLocationSelect) {
        const geocoder = new google.maps.Geocoder();
        
        mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            geocoder.geocode(
              { location: { lat, lng } },
              (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (status === 'OK' && results && results[0]) {
                  onLocationSelect({
                    lat,
                    lng,
                    address: results[0].formatted_address
                  });
                }
              }
            );
          }
        });
      }
    } catch (error) {
      console.error('Error creating map:', error);
    }
  }, [isLoaded, center, zoom, onLocationSelect, map]);

  // Update map center when center prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Handle markers
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersArray.forEach(marker => marker.setMap(null));
    setMarkersArray([]);

    // Add new markers
    if (markers.length > 0) {
      const newMarkers = markers.map(markerData => {
        const marker = new google.maps.Marker({
          position: markerData.position,
          map: map,
          title: markerData.title,
        });

        if (markerData.info) {
          const infoWindow = new google.maps.InfoWindow({
            content: markerData.info,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }

        return marker;
      });

      setMarkersArray(newMarkers);
    }
  }, [map, isLoaded, markers]);

  if (loadError) {
    return (
      <div 
        style={{ height }} 
        className={`w-full rounded-lg bg-muted flex items-center justify-center ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <p>Failed to load map</p>
          <p className="text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        style={{ height }} 
        className={`w-full rounded-lg bg-muted flex items-center justify-center ${className}`}
      >
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className={`w-full rounded-lg ${className}`}
    />
  );
};

export default GoogleMap;