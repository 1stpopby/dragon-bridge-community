import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, HelpCircle, Eye, ClipboardList, MessageSquare, RefreshCw, Star, CheckCircle, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { ServiceRequestResponsesDialog } from "@/components/ServiceRequestResponsesDialog";
import { ServiceRequestManagementDialog } from "@/components/ServiceRequestManagementDialog";
import { ServiceResponseDialog } from "@/components/ServiceResponseDialog";
import { formatDistanceToNow } from "date-fns";

interface ServiceInquiry {
  id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string;
  message: string;
  inquiry_type: string;
  created_at: string;
  service_id: string;
}

interface ServiceResponse {
  id: string;
  request_id: string;
  company_id: string;
  response_message: string;
  contact_email: string;
  contact_phone: string;
  estimated_cost: string;
  availability: string;
  response_status: string;
  created_at: string;
  updated_at: string;
}

interface ServiceRequest {
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
  response_count?: number;
  category?: string;
  location?: string;
  budget_range?: string;
  priority?: string;
}

const ServiceManagement = () => {
  const { user, profile } = useAuth();
  const [serviceResponses, setServiceResponses] = useState<ServiceResponse[] | ServiceInquiry[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<ServiceInquiry[]>([]);
  const [myServiceRequests, setMyServiceRequests] = useState<ServiceRequest[]>([]);
  const [completedServices, setCompletedServices] = useState<ServiceRequest[]>([]);
  const [showCompletedServices, setShowCompletedServices] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestTitle, setSelectedRequestTitle] = useState<string>("");
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedServiceResponse, setSelectedServiceResponse] = useState<ServiceInquiry | null>(null);
  const [serviceResponseDialogOpen, setServiceResponseDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchServiceResponses();
      fetchReceivedMessages();
      fetchMyServiceRequests();
      fetchCompletedServices();

      // Set up real-time subscriptions for automatic updates
      const responseChannel = supabase
        .channel('service-responses')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_request_responses',
          },
          () => {
            console.log('New service response received, refreshing data...');
            fetchServiceResponses();
            fetchReceivedMessages();
            fetchMyServiceRequests();
            fetchCompletedServices();
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
            console.log('Service response updated, refreshing data...');
            fetchServiceResponses();
            fetchReceivedMessages();
            fetchMyServiceRequests();
            fetchCompletedServices();
          }
        )
        .subscribe();

      const inquiryChannel = supabase
        .channel('service-inquiries')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_inquiries',
          },
          () => {
            console.log('New service inquiry received, refreshing data...');
            fetchServiceResponses();
            fetchReceivedMessages();
            fetchMyServiceRequests();
            fetchCompletedServices();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'service_inquiries',
          },
          () => {
            console.log('Service inquiry updated, refreshing data...');
            fetchServiceResponses();
            fetchReceivedMessages();
            fetchMyServiceRequests();
            fetchCompletedServices();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(responseChannel);
        supabase.removeChannel(inquiryChannel);
      };
    }
  }, [user]);

  const fetchServiceResponses = async () => {
    try {
      if (profile?.account_type === 'company') {
        // For companies, fetch their sent responses with request details
        const { data, error } = await supabase
          .from('service_request_responses')
          .select(`
            *,
            service_inquiries:request_id (
              id,
              inquirer_name,
              inquirer_email,
              message,
              status,
              created_at
            )
          `)
          .eq('company_id', profile?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Format the responses to include request details
        const formattedResponses = (data || []).map(response => ({
          ...response,
          request_details: response.service_inquiries,
          // Add status info for better UI display
          status_display: response.response_status || 'pending'
        }));
        
        setServiceResponses(formattedResponses);
      } else {
        // For users, fetch service responses they received
        const { data, error } = await supabase
          .from('service_inquiries')
          .select('*')
          .eq('user_id', user?.id)
          .eq('inquiry_type', 'contact')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServiceResponses(data || []);
      }
    } catch (error) {
      console.error('Error fetching service responses:', error);
    }
  };

  const fetchReceivedMessages = async () => {
    try {
      if (profile?.account_type === 'company') {
        // For companies, fetch messages they received from users requesting service info
        const { data, error } = await supabase
          .from('service_inquiries')
          .select('*')
          .in('service_id', await getCompanyServiceIds())
          .eq('inquiry_type', 'contact')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReceivedMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching received messages:', error);
    }
  };

  const getCompanyServiceIds = async () => {
    try {
      const { data, error } = await supabase
        .from('company_services')
        .select('service_id')
        .eq('company_id', profile?.id);
      
      if (error) throw error;
      return (data || []).map(service => service.service_id).filter(Boolean);
    } catch (error) {
      console.error('Error fetching company service IDs:', error);
      return [];
    }
  };

  const handleManualRefresh = async () => {
    try {
      await fetchMyServiceRequests();
      await fetchCompletedServices();
    } catch (error) {
      console.error('Error during refresh:', error);
    }
  };

  const fetchMyServiceRequests = async () => {
    try {
      // Get service requests that are NOT completed
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('user_id', user?.id)
        .eq('inquiry_type', 'request_service')
        .neq('status', 'completed') // Filter out completed services
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get response counts for each request
      const requestsWithCounts = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: responsesData, error: responsesError } = await supabase
            .from('service_request_responses')
            .select('id')
            .eq('request_id', request.id);

          if (responsesError) throw responsesError;

          return {
            ...request,
            response_count: responsesData?.length || 0
          };
        })
      );

      setMyServiceRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  };

  const fetchCompletedServices = async () => {
    try {
      // Get service requests that are completed
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('user_id', user?.id)
        .eq('inquiry_type', 'request_service')
        .eq('status', 'completed') // Only get completed services
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get response counts for each request
      const requestsWithCounts = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: responsesData, error: responsesError } = await supabase
            .from('service_request_responses')
            .select('id')
            .eq('request_id', request.id);

          if (responsesError) throw responsesError;

          return {
            ...request,
            response_count: responsesData?.length || 0
          };
        })
      );

      setCompletedServices(requestsWithCounts);
    } catch (error) {
      console.error('Error fetching completed services:', error);
    }
  };

  const handleResponseClick = (response: ServiceInquiry) => {
    setSelectedServiceResponse(response);
    setServiceResponseDialogOpen(true);
  };

  const isServiceResponse = (response: ServiceResponse | ServiceInquiry): response is ServiceResponse => {
    return 'response_message' in response;
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Service Management</h1>
              <p className="text-muted-foreground">
                {profile?.account_type === 'company' 
                  ? 'Manage your service responses and client communications' 
                  : 'Track your service requests and responses'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCompletedServices(!showCompletedServices)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {showCompletedServices ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Completed Services
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Completed Services ({completedServices.length})
                </>
              )}
            </Button>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {profile?.account_type === 'company' ? (
          // Company view
          <Tabs defaultValue="sent-responses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sent-responses">
                <MessageSquare className="h-4 w-4 mr-2" />
                Sent Responses ({serviceResponses.length})
              </TabsTrigger>
              <TabsTrigger value="received-messages">
                <HelpCircle className="h-4 w-4 mr-2" />
                Received Messages ({receivedMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sent-responses">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Sent Responses
                  </CardTitle>
                  <CardDescription>
                    Your responses to customer service requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {serviceResponses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No responses sent yet</p>
                        <p className="text-sm">When you respond to customer service requests, they'll appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {serviceResponses.map((response) => (
                          <div
                            key={response.id}
                            className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => !isServiceResponse(response) && handleResponseClick(response)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Response Sent</span>
                                <Badge variant={
                                  response.response_status === 'completed' ? 'default' :
                                  response.response_status === 'accepted' ? 'default' :
                                  response.response_status === 'declined' ? 'destructive' :
                                  'secondary'
                                } className={`text-xs ${
                                  response.response_status === 'completed' ? 'bg-green-100 text-green-800' : ''
                                }`}>
                                  Status: {response.response_status || 'Pending'}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {isServiceResponse(response) ? response.response_message : response.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="received-messages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Received Messages
                  </CardTitle>
                  <CardDescription>
                    Messages from users requesting information about your services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {receivedMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No messages received yet</p>
                        <p className="text-sm">When users request more information about your services, their messages will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {receivedMessages.map((message) => (
                          <div
                            key={message.id}
                            className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => handleResponseClick(message)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Service Inquiry</span>
                                <Badge variant="secondary" className="text-xs">From {message.inquirer_name}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {message.message}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Contact: {message.inquirer_email}</span>
                              {message.inquirer_phone && (
                                <span>• Phone: {message.inquirer_phone}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // User view - simplified to show only service requests
          <div className="w-full space-y-6">
            {/* My Service Requests - Simplified View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  My Service Requests
                </CardTitle>
                <CardDescription>
                  Service requests you've submitted and their responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {myServiceRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No service requests yet</p>
                      <p className="text-sm">When you submit a service request, it will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myServiceRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Service Request</span>
                              <Badge variant="outline" className="text-xs">
                                {request.status || 'Submitted'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {request.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>
                                {request.response_count || 0} responses received
                              </span>
                            </div>
                            <ServiceRequestManagementDialog
                              requestId={request.id}
                              requestTitle={request.message.substring(0, 50) + '...'}
                              requestStatus={request.status}
                              triggerButton={
                                <Button size="sm" variant="outline">
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Manage Request
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Completed Services Section */}
            {showCompletedServices && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed Services ({completedServices.length})
                  </CardTitle>
                  <CardDescription>
                    Your completed service requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {completedServices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No completed services yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {completedServices.map((service) => (
                          <div
                            key={service.id}
                            className="p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Completed Service</span>
                                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                  {service.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(service.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {service.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span>
                                  {service.response_count || 0} responses received
                                </span>
                              </div>
                              <ServiceRequestManagementDialog
                                requestId={service.id}
                                requestTitle={service.message.substring(0, 50) + '...'}
                                requestStatus={service.status}
                                triggerButton={
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Service Request Response Dialog */}
        {selectedRequestId && (
          <ServiceRequestResponsesDialog
            requestId={selectedRequestId}
            requestTitle={selectedRequestTitle}
            open={responseDialogOpen}
            onOpenChange={setResponseDialogOpen}
            triggerButton={null}
          />
        )}

        {/* Service Response Dialog */}
        {selectedServiceResponse && (
          <ServiceResponseDialog
            response={selectedServiceResponse}
            open={serviceResponseDialogOpen}
            onOpenChange={setServiceResponseDialogOpen}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceManagement;