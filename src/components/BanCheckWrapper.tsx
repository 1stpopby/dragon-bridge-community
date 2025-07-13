import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBanCheck } from '@/hooks/useBanCheck';
import { useAuth } from '@/hooks/useAuth';

interface BanCheckWrapperProps {
  children: React.ReactNode;
}

export function BanCheckWrapper({ children }: BanCheckWrapperProps) {
  const { user } = useAuth();
  const { isBanned, loading } = useBanCheck();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user is logged in, not loading, is banned, and not already on banned page
    if (user && !loading && isBanned && location.pathname !== '/banned') {
      navigate('/banned', { replace: true });
    }
  }, [user, isBanned, loading, navigate, location.pathname]);

  // If user is banned and not on banned page, don't render children
  if (user && !loading && isBanned && location.pathname !== '/banned') {
    return null;
  }

  return <>{children}</>;
}