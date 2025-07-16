import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Clock, MapPin, Target, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ServiceRequestNotification {
  id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string;
  message: string;
  inquiry_type: string;
  created_at: string;
  service_id: string;
  status: string;
  user_id: string;
}

interface ServiceRequestNotificationsProps {
  className?: string;
}

export function ServiceRequestNotifications({ className }: ServiceRequestNotificationsProps) {
  const [newRequests, setNewRequests] = useState<ServiceRequestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile?.account_type === 'company') {
      fetchNewRequests();
      
      // Set up real-time subscription for new service requests
      const channel = supabase
        .channel('service-inquiries')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_inquiries',
            filter: 'inquiry_type=eq.request_service',
          },
          () => {
            fetchNewRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const fetchNewRequests = async () => {
    if (!user || !profile) return;
    
    try {
      setLoading(true);
      // Fetch recent service requests (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data, error } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('inquiry_type', 'request_service')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setNewRequests(data || []);
    } catch (error) {
      console.error('Error fetching new requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (requestId: string) => {
    setNewRequests(prev => prev.filter(request => request.id !== requestId));
  };

  const parseRequestDetails = (message: string) => {
    const lines = message.split('\n');
    const details: any = {};
    
    lines.forEach(line => {
      if (line.includes('Location:')) details.location = line.split('Location:')[1]?.trim();
      if (line.includes('Category:')) details.category = line.split('Category:')[1]?.trim();
      if (line.includes('Urgency:')) details.priority = line.split('Urgency:')[1]?.trim();
    });
    
    return details;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading || !user || profile?.account_type !== 'company') {
    return null;
  }

  if (newRequests.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          New Service Requests ({newRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {newRequests.map((request) => {
          const details = parseRequestDetails(request.message);
          
          return (
            <div
              key={request.id}
              className="p-3 border rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">{request.inquirer_name}</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    New Request
                  </Badge>
                  {details.priority && (
                    <Badge variant={getPriorityColor(details.priority)} className="text-xs">
                      {details.priority}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                {details.category && (
                  <span>{details.category}</span>
                )}
                {details.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {details.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  0 responses
                </span>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dismissNotification(request.id)}
                  className="text-xs"
                >
                  Dismiss
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Navigate to service requests tab
                    window.location.href = '/services?tab=requests';
                  }}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Request
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 