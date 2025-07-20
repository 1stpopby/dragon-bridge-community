import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Get the API key from Supabase edge function
        const response = await fetch('/api/get-google-maps-key');
        const { apiKey } = await response.json();
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        const { Map } = await loader.importLibrary('maps');
        
        if (mapRef.current) {
          const mapInstance = new Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          setMap(mapInstance);
          setIsLoaded(true);

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
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom, onLocationSelect]);

  useEffect(() => {
    if (map && isLoaded && markers.length > 0) {
      // Clear existing markers
      markers.forEach(markerData => {
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
      });
    }
  }, [map, isLoaded, markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className={`w-full rounded-lg ${className}`}
    />
  );
};

export default GoogleMap;