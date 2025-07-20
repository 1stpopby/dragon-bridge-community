import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicTitle = () => {
  useEffect(() => {
    const updateTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'app_name')
          .single();

        if (error || !data) {
          console.error('Error fetching app name:', error);
          return;
        }

        let appName;
        try {
          appName = typeof data.setting_value === 'string' 
            ? JSON.parse(data.setting_value)
            : data.setting_value;
        } catch {
          appName = data.setting_value;
        }

        if (appName && typeof appName === 'string') {
          document.title = appName;
        }
      } catch (error) {
        console.error('Error updating title:', error);
      }
    };

    updateTitle();

    // Listen for changes in app_settings table
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'setting_key=eq.app_name'
        },
        () => {
          updateTitle();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};