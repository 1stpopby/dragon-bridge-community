import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          return;
        }

        // Get API key from edge function with retry logic
        let apiKey = null;
        let retries = 3;
        
        while (retries > 0 && !apiKey) {
          try {
            const response = await fetch('https://spbbiaqrybijcnopbiej.supabase.co/functions/v1/get-google-maps-key');
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }
            
            apiKey = data.apiKey;
          } catch (error) {
            console.error(`Attempt ${4 - retries}: Failed to fetch API key:`, error);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        }
        
        if (!apiKey) {
          throw new Error('Failed to fetch Google Maps API key after multiple attempts');
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          setIsLoaded(true);
        };

        script.onerror = () => {
          setLoadError('Failed to load Google Maps');
        };

        // Add script only if not already present
        if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
          document.head.appendChild(script);
        }

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    loadGoogleMaps();
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};