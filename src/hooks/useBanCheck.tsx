import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useBanCheck = () => {
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkBanStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is banned using the database function
      const { data, error } = await supabase
        .rpc('is_user_banned', { check_user_id: user.id });

      if (error) {
        console.error('Error checking ban status:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Fetch ban details
        const { data: banData, error: banError } = await supabase
          .from('user_bans')
          .select('reason, ban_type, expires_at, banned_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (!banError && banData) {
          setBanInfo(banData);
        }
      }

      setIsBanned(data || false);
    } catch (error) {
      console.error('Error checking ban status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBanStatus();
  }, [user]);

  return { isBanned, banInfo, loading, recheckBanStatus: checkBanStatus };
};