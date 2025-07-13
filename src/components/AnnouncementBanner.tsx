import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  published_at: string;
  expires_at: string | null;
  target_audience: string[];
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      setDismissedAnnouncements(JSON.parse(dismissed));
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [user, profile]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Filter announcements based on target audience
      const filteredAnnouncements = (data || []).filter((announcement: any) => {
        const targetAudience = announcement.target_audience || ['all'];
        
        if (targetAudience.includes('all')) return true;
        
        if (!user || !profile) {
          return targetAudience.includes('all');
        }
        
        if (targetAudience.includes('users') && profile.account_type === 'user') return true;
        if (targetAudience.includes('companies') && profile.account_type === 'company') return true;
        if (targetAudience.includes('admins')) {
          // Check if user is admin (you'd need to implement this check)
          return false; // For now, we'll skip admin-only announcements
        }
        
        return false;
      });

      setAnnouncements(filteredAnnouncements as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleDismiss = async (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));

    // Increment view count
    try {
      const { data: current } = await supabase
        .from('announcements')
        .select('view_count')
        .eq('id', announcementId)
        .single();
      
      if (current) {
        await supabase
          .from('announcements')
          .update({ view_count: (current.view_count || 0) + 1 })
          .eq('id', announcementId);
      }
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'normal': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'low': return 'bg-gray-50 border-gray-200 text-gray-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'normal': return <Info className="h-4 w-4 text-blue-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`${getPriorityColor(announcement.priority)} border animate-fade-in`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getPriorityIcon(announcement.priority)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-sm">{announcement.title}</h4>
                    {announcement.priority !== 'normal' && (
                      <Badge variant="outline" className="text-xs">
                        {announcement.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(announcement.published_at), 'MMM d, yyyy')}</span>
                    </div>
                    {announcement.expires_at && (
                      <span>
                        Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(announcement.id)}
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}