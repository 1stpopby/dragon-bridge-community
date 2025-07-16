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
}

const ServiceManagement = () => {
  const { user, profile } = useAuth();
  const [serviceResponses, setServiceResponses] = useState<ServiceResponse[] | ServiceInquiry[]>([]);
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
          .eq('company_id', user?.id)
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

      // Get company names for each feedback
      const feedbackWithCompanyNames = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, company_name')
            .eq('id', feedback.company_id)
            .single();

          return {
            ...feedback,
            company_name: profileData?.company_name,
            company_display_name: profileData?.display_name
          };
        })
      );

      setMyFeedback(feedbackWithCompanyNames);
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
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="sent-responses">
                <MessageSquare className="h-4 w-4 mr-2" />
                Sent Responses ({serviceResponses.length})
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
                              <ServiceRequestResponsesDialog
                                requestId={request.id}
                                requestTitle={request.message.substring(0, 50) + '...'}
                                triggerButton={
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Responses
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
                          View Completed Services ({completedServices.length})
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
                    {/* Completed Services Section */}
                    {showCompletedServices && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Completed Services
                        </h3>
                        
                        {completedServices.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No completed services yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4 mb-6">
                            {completedServices.map((service) => (
                              <div
                                key={service.id}
                                className="p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-green-900">{service.category}</h4>
                                    <p className="text-sm text-green-700 mt-1">{service.message}</p>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    Completed
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-green-600">
                                  <div className="flex items-center gap-4">
                                    <span>Budget: {service.budget_range}</span>
                                    <span>Location: {service.location}</span>
                                  </div>
                                  <span>
                                    {formatDistanceToNow(new Date(service.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="border-t pt-4 mb-4">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Your Feedback
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* Feedback Section */}
                    {myFeedback.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No feedback submitted yet</p>
                        <p className="text-sm">When you complete services and leave feedback, it will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myFeedback.map((feedback) => (
                          <div
                            key={feedback.id}
                            className="p-4 border rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {feedback.company_name || feedback.company_display_name}
                                </span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span 
                                      key={star}
                                      className={`text-sm ${
                                        star <= feedback.rating 
                                          ? 'text-yellow-500' 
                                          : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="ml-1 text-sm text-blue-700">
                                    {feedback.rating}/5
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-900">{feedback.title}</h4>
                              <p className="text-sm text-blue-700">{feedback.comment}</p>
                              
                              {(feedback.service_quality_rating || feedback.communication_rating || 
                                feedback.timeliness_rating || feedback.value_rating) && (
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-300">
                                  {feedback.service_quality_rating && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Service Quality:</span>
                                      <span className="ml-1 text-blue-700">{feedback.service_quality_rating}/5</span>
                                    </div>
                                  )}
                                  {feedback.communication_rating && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Communication:</span>
                                      <span className="ml-1 text-blue-700">{feedback.communication_rating}/5</span>
                                    </div>
                                  )}
                                  {feedback.timeliness_rating && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Timeliness:</span>
                                      <span className="ml-1 text-blue-700">{feedback.timeliness_rating}/5</span>
                                    </div>
                                  )}
                                  {feedback.value_rating && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Value:</span>
                                      <span className="ml-1 text-blue-700">{feedback.value_rating}/5</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {feedback.would_recommend && (
                                <div className="flex items-center gap-1 text-xs text-green-700 mt-2">
                                  <span>👍</span>
                                  <span>Would recommend</span>
                                </div>
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