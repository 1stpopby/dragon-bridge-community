import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationCounts {
  newServices: number;
  newUsers: number;
  newEvents: number;
}

export const useAdminNotifications = () => {
  const [counts, setCounts] = useState<NotificationCounts>({
    newServices: 0,
    newUsers: 0,
    newEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Get new services count
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo.toISOString());

      // Get new users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo.toISOString());

      // Get new events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo.toISOString());

      setCounts({
        newServices: servicesCount || 0,
        newUsers: usersCount || 0,
        newEvents: eventsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Set up real-time subscriptions for immediate updates
    const servicesChannel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'services'
        },
        () => fetchCounts()
      )
      .subscribe();

    const usersChannel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        () => fetchCounts()
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  return { counts, loading, refetch: fetchCounts };
};