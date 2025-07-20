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
  responses_count?: number;
  category?: string;
  location?: string;
  budget_range?: string;
  priority?: string;
}

interface ServiceFeedback {
  id: string;
  rating: number;
  title: string;
  comment: string;
  would_recommend: boolean;
  service_quality_rating: number | null;
  communication_rating: number | null;
  timeliness_rating: number | null;
  value_rating: number | null;
  created_at: string;
  company_id: string;
  request_id: string;
  response_id: string;
  company_name?: string;
  company_display_name?: string;
  service_request?: ServiceRequest;
}

const ServiceManagement = () => {
  const { user, profile } = useAuth();
  const [serviceResponses, setServiceResponses] = useState<ServiceResponse[] | ServiceInquiry[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<ServiceInquiry[]>([]);
  const [myServiceRequests, setMyServiceRequests] = useState<ServiceRequest[]>([]);
  const [myFeedback, setMyFeedback] = useState<ServiceFeedback[]>([]);
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
      fetchMyFeedback();
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
        // For companies, fetch messages they received from users
        const { data, error } = await supabase
          .from('service_inquiries')
          .select('*')
          .eq('user_id', user?.id)
          .eq('inquiry_type', 'contact')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReceivedMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching received messages:', error);
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

  const fetchMyFeedback = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('service_feedback')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Get company names and service details for each feedback
      const feedbackWithDetails = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          // Get company info
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, company_name')
            .eq('id', feedback.company_id)
            .single();

          // Get service request details
          const { data: serviceData } = await supabase
            .from('service_inquiries')
            .select('*')
            .eq('id', feedback.request_id)
            .single();

          return {
            ...feedback,
            company_name: profileData?.company_name,
            company_display_name: profileData?.display_name,
            service_request: serviceData
          };
        })
      );

      setMyFeedback(feedbackWithDetails);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleResponseClick = (response: ServiceInquiry) => {
    setSelectedServiceResponse(response);
    setServiceResponseDialogOpen(true);
  };

  const isServiceResponse = (response: ServiceResponse | ServiceInquiry): response is ServiceResponse => {
    return 'response_message' in response;
  };

  const parseResponseMessage = (message: string) => {
    if (message.includes('Response to service request:')) {
      const parts = message.split('Response to service request:');
      if (parts.length > 1) {
        const content = parts[1].split('Contact Information:')[0]?.trim();
        const contactInfo = parts[1].split('Contact Information:')[1]?.trim();
        return { content, contactInfo };
      }
    }
    return { content: message, contactInfo: null };
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
                            
                            {/* Show request details if available */}
                            {response.request_details && (
                              <div className="mb-2 p-2 bg-muted/30 rounded text-xs">
                                <div className="font-medium mb-1">Original Request from {response.request_details.inquirer_name}</div>
                                <div className="text-muted-foreground line-clamp-1">
                                  {response.request_details.message}
                                </div>
                              </div>
                            )}
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              <span className="font-medium">Your Response:</span> {response.response_message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Contact: {response.contact_email}</span>
                              {response.contact_phone && <span>Phone: {response.contact_phone}</span>}
                              {response.estimated_cost && <span>Cost: {response.estimated_cost}</span>}
                            </div>
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
                    Messages received from users through your services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {receivedMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No messages received yet</p>
                        <p className="text-sm">When users contact you through services, messages will appear here</p>
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
                                <span className="font-medium">Message from {message.inquirer_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Contact
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                              {message.message}
                            </p>
                            
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Email: {message.inquirer_email}</span>
                              <span>Phone: {message.inquirer_phone || 'Not provided'}</span>
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
          // User view
          <Tabs defaultValue="my-requests" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-requests">
                <HelpCircle className="h-4 w-4 mr-2" />
                My Requests ({myServiceRequests.length})
              </TabsTrigger>
              <TabsTrigger value="responses">
                <MessageSquare className="h-4 w-4 mr-2" />
                Responses ({serviceResponses.length})
              </TabsTrigger>
              <TabsTrigger value="my-feedback">
                <MessageSquare className="h-4 w-4 mr-2" />
                My Feedback ({myFeedback.length})
              </TabsTrigger>
            </TabsList>

            {/* My Requests Tab */}
            <TabsContent value="my-requests">
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
                                  {request.responses_count || 0} responses received
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
            </TabsContent>

            {/* Service Responses Tab */}
            <TabsContent value="responses">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Service Responses
                  </CardTitle>
                  <CardDescription>
                    Responses from service providers to your requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {serviceResponses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No service responses yet</p>
                        <p className="text-sm">When companies respond to your service requests, they'll appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {serviceResponses.map((response) => {
                          const { content, contactInfo } = parseResponseMessage(response.message);
                          return (
                            <div
                              key={response.id}
                              className="p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                              onClick={() => handleResponseClick(response)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">Service Response</span>
                                  <Badge variant="secondary" className="text-xs">From {response.inquirer_name}</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="space-y-3">
                                <p className="text-sm">{content}</p>
                                {contactInfo && (
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Contact Information:</h5>
                                    <p className="text-sm whitespace-pre-line">{contactInfo}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Click to view full response details
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Feedback Tab */}
            <TabsContent value="my-feedback">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    My Feedback
                  </CardTitle>
                  <CardDescription>
                    Your feedback and reviews for completed services
                  </CardDescription>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowCompletedServices(!showCompletedServices);
                        if (!showCompletedServices) {
                          fetchCompletedServices();
                        }
                      }}
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
                          Show Completed Services ({completedServices.length})
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleManualRefresh}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {/* Feedback Section */}
                    {myFeedback.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No feedback submitted yet</p>
                        <p className="text-sm">When you complete services and leave feedback, it will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {myFeedback.map((feedback) => (
                          <div key={feedback.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                            {/* Service Details Header */}
                            {feedback.service_request && (
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-6 border-b border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg text-emerald-900 dark:text-emerald-100">
                                        Completed Service
                                      </h3>
                                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Service completed successfully
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                </div>
                                
                                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <ClipboardList className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                      Original Service Request
                                    </span>
                                  </div>
                                  {/* Parse and format the service request details */}
                                  {(() => {
                                    const message = feedback.service_request.message;
                                    if (message.includes('Location:') && message.includes('Category:')) {
                                      // Extract structured information from the message
                                      const locationMatch = message.match(/Location:\s*([^,\n]+)/);
                                      const categoryMatch = message.match(/Category:\s*([^,\n]+)/);
                                      const serviceTypeMatch = message.match(/Service Type:\s*([^,\n]+)/);
                                      const budgetMatch = message.match(/Budget:\s*([^,\n]+)/);
                                      const urgencyMatch = message.match(/Urgency:\s*([^,\n]+)/);
                                      const descriptionMatch = message.match(/Description:\s*(.+)$/);
                                      
                                      const location = locationMatch?.[1]?.trim();
                                      const category = categoryMatch?.[1]?.trim();
                                      const serviceType = serviceTypeMatch?.[1]?.trim();
                                      const budget = budgetMatch?.[1]?.trim();
                                      const urgency = urgencyMatch?.[1]?.trim();
                                      const description = descriptionMatch?.[1]?.trim();
                                      
                                      return (
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-2 gap-4">
                                            {location && (
                                              <div className="flex flex-col">
                                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Location</span>
                                                <span className="text-sm text-emerald-800 dark:text-emerald-200">{location}</span>
                                              </div>
                                            )}
                                            {category && (
                                              <div className="flex flex-col">
                                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Category</span>
                                                <span className="text-sm text-emerald-800 dark:text-emerald-200">{category}</span>
                                              </div>
                                            )}
                                            {serviceType && (
                                              <div className="flex flex-col">
                                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Service Type</span>
                                                <span className="text-sm text-emerald-800 dark:text-emerald-200">{serviceType}</span>
                                              </div>
                                            )}
                                            {budget && (
                                              <div className="flex flex-col">
                                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Budget</span>
                                                <span className="text-sm text-emerald-800 dark:text-emerald-200">£{budget}</span>
                                              </div>
                                            )}
                                            {urgency && (
                                              <div className="flex flex-col">
                                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Urgency</span>
                                                <span className="text-sm text-emerald-800 dark:text-emerald-200 capitalize">{urgency}</span>
                                              </div>
                                            )}
                                          </div>
                                          {description && (
                                            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-700">
                                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 block">Description</span>
                                              <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">{description}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // Fallback to original format if structured data not available
                                      return (
                                        <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                          {message}
                                        </p>
                                      );
                                    }
                                  })()}
                                  
                                  <div className="flex items-center gap-6 text-xs text-emerald-600 dark:text-emerald-400 mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                                    {feedback.service_request.inquiry_type && (
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                        Type: {feedback.service_request.inquiry_type}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                      Requested: {formatDistanceToNow(new Date(feedback.service_request.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Feedback Details */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                      {feedback.company_name || feedback.company_display_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-4 w-4 ${
                                              star <= feedback.rating 
                                                ? 'text-yellow-500 fill-yellow-500' 
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        {feedback.rating}/5
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                                  {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <MessageSquare className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Your Feedback
                                  </span>
                                </div>
                                
                                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                  {feedback.title}
                                </h5>
                                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                  {feedback.comment}
                                </p>
                                
                                {(feedback.service_quality_rating || feedback.communication_rating || 
                                  feedback.timeliness_rating || feedback.value_rating) && (
                                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                                    {feedback.service_quality_rating && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-blue-700 dark:text-blue-300">Service Quality:</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                          <span className="font-medium text-blue-800 dark:text-blue-200">
                                            {feedback.service_quality_rating}/5
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {feedback.communication_rating && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-blue-700 dark:text-blue-300">Communication:</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                          <span className="font-medium text-blue-800 dark:text-blue-200">
                                            {feedback.communication_rating}/5
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {feedback.timeliness_rating && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-blue-700 dark:text-blue-300">Timeliness:</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                          <span className="font-medium text-blue-800 dark:text-blue-200">
                                            {feedback.timeliness_rating}/5
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {feedback.value_rating && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-blue-700 dark:text-blue-300">Value:</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                          <span className="font-medium text-blue-800 dark:text-blue-200">
                                            {feedback.value_rating}/5
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {feedback.would_recommend && (
                                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                                      <span className="text-emerald-600">👍</span>
                                    </div>
                                    <span className="font-medium">Would recommend this service</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show additional completed services if button is toggled */}
                    {showCompletedServices && completedServices.length > 0 && (
                      <div className="mt-8 pt-6 border-t">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-amber-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                            Other Completed Services (No Feedback Yet)
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {completedServices.filter(service => !myFeedback.some(feedback => feedback.request_id === service.id)).map((service) => (
                            <div
                              key={service.id}
                              className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 rounded-xl border border-amber-200 dark:border-amber-800 p-5 shadow-sm"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-amber-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                                      Completed Service Request
                                    </h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                      Service completed • No feedback provided yet
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              
                              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <ClipboardList className="h-4 w-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                    Service Request Details
                                  </span>
                                </div>
                                {/* Parse and format the service request details */}
                                {(() => {
                                  const message = service.message;
                                  if (message.includes('Location:') && message.includes('Category:')) {
                                    // Extract structured information from the message
                                    const locationMatch = message.match(/Location:\s*([^,\n]+)/);
                                    const categoryMatch = message.match(/Category:\s*([^,\n]+)/);
                                    const serviceTypeMatch = message.match(/Service Type:\s*([^,\n]+)/);
                                    const budgetMatch = message.match(/Budget:\s*([^,\n]+)/);
                                    const urgencyMatch = message.match(/Urgency:\s*([^,\n]+)/);
                                    const descriptionMatch = message.match(/Description:\s*(.+)$/);
                                    
                                    const location = locationMatch?.[1]?.trim();
                                    const category = categoryMatch?.[1]?.trim();
                                    const serviceType = serviceTypeMatch?.[1]?.trim();
                                    const budget = budgetMatch?.[1]?.trim();
                                    const urgency = urgencyMatch?.[1]?.trim();
                                    const description = descriptionMatch?.[1]?.trim();
                                    
                                    return (
                                      <div className="space-y-3 mb-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          {location && (
                                            <div className="flex flex-col">
                                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Location</span>
                                              <span className="text-sm text-amber-800 dark:text-amber-200">{location}</span>
                                            </div>
                                          )}
                                          {category && (
                                            <div className="flex flex-col">
                                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Category</span>
                                              <span className="text-sm text-amber-800 dark:text-amber-200">{category}</span>
                                            </div>
                                          )}
                                          {serviceType && (
                                            <div className="flex flex-col">
                                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Service Type</span>
                                              <span className="text-sm text-amber-800 dark:text-amber-200">{serviceType}</span>
                                            </div>
                                          )}
                                          {budget && (
                                            <div className="flex flex-col">
                                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Budget</span>
                                              <span className="text-sm text-amber-800 dark:text-amber-200">£{budget}</span>
                                            </div>
                                          )}
                                          {urgency && (
                                            <div className="flex flex-col">
                                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Urgency</span>
                                              <span className="text-sm text-amber-800 dark:text-amber-200 capitalize">{urgency}</span>
                                            </div>
                                          )}
                                        </div>
                                        {description && (
                                          <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 block">Description</span>
                                            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{description}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // Fallback to original format if structured data not available
                                    return (
                                      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-3">
                                        {message}
                                      </p>
                                    );
                                  }
                                })()}
                                
                                <div className="flex items-center gap-6 text-xs text-amber-600 dark:text-amber-400 pt-3 border-t border-amber-200 dark:border-amber-700">
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                    Type: {service.inquiry_type}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                    Status: {service.status}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                    Requested: {formatDistanceToNow(new Date(service.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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