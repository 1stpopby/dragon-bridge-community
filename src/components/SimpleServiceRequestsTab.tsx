import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, MapPin, DollarSign, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react';

interface ServiceRequest {
  id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone?: string;
  message: string;
  created_at: string;
  user_id?: string;
}

interface ResponseData {
  message: string;
  contact_email: string;
  contact_phone: string;
}

const SimpleServiceRequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseData, setResponseData] = useState<ResponseData>({
    message: '',
    contact_email: '',
    contact_phone: ''
  });
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceRequests();

    // Set up real-time subscription for service request updates
    const channel = supabase
      .channel('service-requests-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_request_responses',
        },
        () => {
          console.log('New service response sent, refreshing requests...');
          fetchServiceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_request_responses',
        },
        () => {
          console.log('Service response updated, refreshing requests...');
          fetchServiceRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Pre-fill contact information when response dialog opens
  useEffect(() => {
    if (showResponseDialog && profile) {
      setResponseData(prev => ({
        ...prev,
        contact_email: prev.contact_email || profile.contact_email || user?.email || '',
        contact_phone: prev.contact_phone || profile.company_phone || profile.phone || ''
      }));
    }
  }, [showResponseDialog, profile, user]);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching service requests...', { user: user?.id, hasUser: !!user });
      
      // Fetch service requests only (inquiry_type = 'request_service' and service_id is null)
      const { data, error } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('inquiry_type', 'request_service')
        .is('service_id', null)
        .order('created_at', { ascending: false });
      
      console.log('Service requests query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // Filter out current user's own requests - they should only see these in Messages
      const filteredRequests = data?.filter(request => 
        !user || request.user_id !== user.id
      ) || [];
      
      console.log('Filtered requests:', { total: data?.length, filtered: filteredRequests.length });
      setRequests(filteredRequests);
      
    } catch (error: any) {
      console.error('Error fetching service requests:', error);
      const errorMessage = error?.message || error?.error_description || 'Failed to load service requests. Please try again.';
      
      // Don't show toast for permission errors - just log them
      if (!error?.message?.includes('permission') && !error?.message?.includes('policy')) {
        toast({
          title: "Error loading requests",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Set empty array so the UI shows "No requests found" instead of loading forever
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };



  const parseServiceRequest = (message: string) => {
    const lines = message.split('\n');
    const data: any = {};
    
    lines.forEach(line => {
      if (line.includes('Location:')) data.location = line.split('Location:')[1]?.trim();
      if (line.includes('Category:')) data.category = line.split('Category:')[1]?.trim();
      if (line.includes('Service Type:')) data.service_type = line.split('Service Type:')[1]?.trim();
      if (line.includes('Budget:')) data.budget = line.split('Budget:')[1]?.trim();
      if (line.includes('Urgency:')) data.urgency = line.split('Urgency:')[1]?.trim();
      if (line.includes('Description:')) {
        const index = lines.indexOf(line);
        data.description = lines.slice(index + 1).join('\n').trim();
      }
    });
    
    return data;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRespond = async (requestId: string) => {
    console.log('🔍 handleRespond called with requestId:', requestId);
    console.log('🔍 responseData:', responseData);
    console.log('🔍 selectedRequest:', selectedRequest);
    console.log('🔍 user:', user);
    console.log('🔍 profile:', profile);
    
    if (!responseData.message.trim()) {
      console.log('❌ No message provided');
      toast({
        title: "Message required",
        description: "Please enter a response message.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRequest) {
      console.log('❌ No selected request');
      toast({
        title: "Error",
        description: "No service request selected.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      console.log('❌ No profile found');
      toast({
        title: "Profile required",
        description: "Please complete your profile before responding.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📤 Attempting to send response...');
      
      // Create a response in the proper service_request_responses table
      const { error } = await supabase
        .from('service_request_responses')
        .insert({
          request_id: requestId,
          company_id: profile.id,
          response_message: responseData.message,
          contact_email: responseData.contact_email || profile.contact_email || user?.email,
          contact_phone: responseData.contact_phone || profile.company_phone,
          response_status: 'pending'
        });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Response sent successfully!');
      
      toast({
        title: "Response sent!",
        description: "Your response has been sent to the requester. They will see it in their Messages page.",
      });

      // Reset all states
      setSelectedRequest(null);
      setShowResponseDialog(false);
      setResponseData({ message: '', contact_email: '', contact_phone: '' });
      
      // Refresh the service requests list
      fetchServiceRequests();
      
    } catch (error) {
      console.error('❌ Error sending response:', error);
      toast({
        title: "Error sending response",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const ServiceRequestCard: React.FC<{ request: ServiceRequest }> = ({ request }) => {
    const requestData = parseServiceRequest(request.message);
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500"
        onClick={() => setSelectedRequest(request)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {request.inquirer_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{request.inquirer_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {requestData.urgency && (
              <Badge className={`text-xs ${getUrgencyColor(requestData.urgency)}`}>
                {requestData.urgency}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {requestData.service_type && (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{requestData.service_type}</span>
              </div>
            )}
            {requestData.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{requestData.location}</span>
              </div>
            )}
            {requestData.budget && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{requestData.budget}</span>
              </div>
            )}
            {requestData.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {requestData.description}
              </p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t">
            <Button 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(request);
                setShowResponseDialog(true);
              }}
            >
              Respond to Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ServiceRequestDetailDialog: React.FC<{ request: ServiceRequest; open: boolean; onClose: () => void }> = ({ request, open, onClose }) => {
    const requestData = parseServiceRequest(request.message);
    
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {request.inquirer_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{request.inquirer_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Service Request • {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{request.inquirer_email}</span>
                </div>
                {request.inquirer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.inquirer_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Request Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Service Request Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requestData.service_type && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Service Type</Label>
                    <p className="mt-1">{requestData.service_type}</p>
                  </div>
                )}
                {requestData.category && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="mt-1">{requestData.category}</p>
                  </div>
                )}
                {requestData.location && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {requestData.location}
                    </p>
                  </div>
                )}
                {requestData.budget && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Budget</Label>
                    <p className="mt-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {requestData.budget}
                    </p>
                  </div>
                )}
                {requestData.urgency && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Urgency</Label>
                    <div className="mt-1">
                      <Badge className={getUrgencyColor(requestData.urgency)}>
                        {requestData.urgency}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {requestData.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{requestData.description}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={() => {
                  setShowResponseDialog(true);
                  onClose();
                }}
                className="flex-1"
              >
                Respond to Request
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Requests</h2>
          <p className="text-muted-foreground">Browse service requests from community members</p>
        </div>
        <Button onClick={fetchServiceRequests} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Service Requests</h3>
            <p className="text-muted-foreground">
              No service requests have been submitted yet. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <ServiceRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Service Request Detail Dialog */}
      {selectedRequest && (
        <ServiceRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest && !showResponseDialog}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {/* Response Dialog */}
      {showResponseDialog && (
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Respond to Service Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="response-message">Your Response</Label>
                <Textarea
                  id="response-message"
                  placeholder="Enter your response message..."
                  value={responseData.message}
                  onChange={(e) => setResponseData({...responseData, message: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={responseData.contact_email}
                  onChange={(e) => setResponseData({...responseData, contact_email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">Contact Phone (Optional)</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={responseData.contact_phone}
                  onChange={(e) => setResponseData({...responseData, contact_phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    console.log('🔍 Send Response button clicked');
                    console.log('🔍 selectedRequest:', selectedRequest);
                    if (selectedRequest) {
                      handleRespond(selectedRequest.id);
                    } else {
                      console.log('❌ No selectedRequest found');
                    }
                  }}
                  className="flex-1"
                >
                  Send Response
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowResponseDialog(false);
                    setSelectedRequest(null);
                    setResponseData({ message: '', contact_email: '', contact_phone: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SimpleServiceRequestsTab; 