import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  User,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ServiceRequestsTabProps {
  searchTerm: string;
}

export function ServiceRequestsTab({ searchTerm }: ServiceRequestsTabProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseData, setResponseData] = useState({
    message: '',
    contact_email: '',
    contact_phone: ''
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('inquiry_type', 'request_service')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "Error loading requests",
        description: "Failed to load service requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const filterRequests = () => {
    return requests.filter(request => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        request.inquirer_name.toLowerCase().includes(searchLower) ||
        request.message.toLowerCase().includes(searchLower) ||
        request.inquirer_email.toLowerCase().includes(searchLower)
      );
    });
  };

  const parseRequestDetails = (message: string) => {
    const lines = message.split('\n');
    const details: any = {};
    
    lines.forEach(line => {
      if (line.includes('Location:')) details.location = line.split('Location:')[1]?.trim();
      if (line.includes('Category:')) details.category = line.split('Category:')[1]?.trim();
      if (line.includes('Service Type:')) details.serviceType = line.split('Service Type:')[1]?.trim();
      if (line.includes('Budget:')) details.budget = line.split('Budget:')[1]?.trim();
      if (line.includes('Urgency:')) details.urgency = line.split('Urgency:')[1]?.trim();
    });
    
    const descriptionStart = message.indexOf('Description:');
    if (descriptionStart !== -1) {
      details.description = message.substring(descriptionStart + 12).trim();
    }
    
    return details;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const handleRespond = async (requestId: string) => {
    if (!responseData.message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a response message.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you could create a responses table or send an email
      // For now, we'll create a new inquiry as a response
      const { error } = await supabase
        .from('service_inquiries')
        .insert({
          service_id: null,
          inquirer_name: profile?.display_name || 'Service Provider',
          inquirer_email: responseData.contact_email || profile?.contact_email || user?.email,
          inquirer_phone: responseData.contact_phone,
          message: `Response to service request:

${responseData.message}

Contact Information:
Email: ${responseData.contact_email || profile?.contact_email || user?.email}
Phone: ${responseData.contact_phone || 'Not provided'}`,
          inquiry_type: 'contact',
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Response sent!",
        description: "Your response has been sent to the requester.",
      });

      setRespondingTo(null);
      setResponseData({ message: '', contact_email: '', contact_phone: '' });
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Error sending response",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return created.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading service requests...</p>
      </div>
    );
  }

  const filteredRequests = filterRequests();

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          {searchTerm ? 'No service requests match your search.' : 'No service requests found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRequests.map((request) => {
          const details = parseRequestDetails(request.message);
          
          return (
            <Card key={request.id} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{details.category || 'General'}</Badge>
                    {details.urgency && (
                      <Badge variant={getUrgencyColor(details.urgency)}>
                        {details.urgency}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTimeAgo(request.created_at)}
                  </div>
                </div>
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {request.inquirer_name}
                </CardTitle>
                {details.serviceType && (
                  <p className="text-sm text-muted-foreground">
                    Looking for: <span className="font-medium">{details.serviceType}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {details.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {details.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {request.inquirer_email}
                  </div>
                  {request.inquirer_phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {request.inquirer_phone}
                    </div>
                  )}
                  {details.budget && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Budget: </span>
                      <span className="font-medium">{details.budget}</span>
                    </div>
                  )}
                </div>

                {details.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Description:</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {details.description}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setRespondingTo(request.id);
                          setResponseData(prev => ({
                            ...prev,
                            contact_email: profile?.contact_email || user?.email || ''
                          }));
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Respond
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Respond to Service Request</DialogTitle>
                        <DialogDescription>
                          Send a response to {request.inquirer_name}'s service request.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contact_email">Your Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={responseData.contact_email}
                            onChange={(e) => setResponseData(prev => ({ ...prev, contact_email: e.target.value }))}
                            placeholder="Your contact email"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="contact_phone">Your Phone (Optional)</Label>
                          <Input
                            id="contact_phone"
                            value={responseData.contact_phone}
                            onChange={(e) => setResponseData(prev => ({ ...prev, contact_phone: e.target.value }))}
                            placeholder="Your phone number"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="message">Response Message</Label>
                          <Textarea
                            id="message"
                            value={responseData.message}
                            onChange={(e) => setResponseData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Introduce your services and how you can help..."
                            rows={4}
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setRespondingTo(null)}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleRespond(request.id)}>
                            Send Response
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${request.inquirer_email}`}>
                      Direct Email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}