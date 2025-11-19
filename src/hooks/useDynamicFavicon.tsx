import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'favicon_url')
          .single();

        if (error || !data) {
          console.error('Error fetching favicon URL:', error);
          return;
        }

        let faviconUrl;
        try {
          faviconUrl = typeof data.setting_value === 'string' 
            ? JSON.parse(data.setting_value)
            : data.setting_value;
        } catch {
          faviconUrl = data.setting_value;
        }

        if (faviconUrl && typeof faviconUrl === 'string' && faviconUrl.trim()) {
          // Remove existing favicon links
          const existingLinks = document.querySelectorAll('link[rel*="icon"]');
          existingLinks.forEach(link => link.remove());

          // Add new favicon
          const link = document.createElement('link');
          link.rel = 'icon';
          
          // Determine the type based on the URL extension
          if (faviconUrl.endsWith('.svg')) {
            link.type = 'image/svg+xml';
          } else if (faviconUrl.endsWith('.png')) {
            link.type = 'image/png';
          } else if (faviconUrl.endsWith('.ico')) {
            link.type = 'image/x-icon';
          }
          
          link.href = faviconUrl;
          document.head.appendChild(link);
        }
      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    };

    updateFavicon();

    // Listen for changes in app_settings table
    const channel = supabase
      .channel('app_settings_favicon_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'setting_key=eq.favicon_url'
        },
        () => {
          updateFavicon();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
