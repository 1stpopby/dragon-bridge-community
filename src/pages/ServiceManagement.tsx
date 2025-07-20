import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, HelpCircle, Eye, ClipboardList, MessageSquare, RefreshCw, Star, CheckCircle, EyeOff, ThumbsUp, Reply } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import { ServiceRequestResponsesDialog } from "@/components/ServiceRequestResponsesDialog";
import { ServiceRequestManagementDialog } from "@/components/ServiceRequestManagementDialog";
import { ServiceResponseDialog } from "@/components/ServiceResponseDialog";
import { ServiceInquiryReplyDialog } from "@/components/ServiceInquiryReplyDialog";
import { UserReplyDialog } from "@/components/UserReplyDialog";
import { CompanyFeedbackManagement } from "@/components/CompanyFeedbackManagement";
import { UserFeedbackReceived } from "@/components/UserFeedbackReceived";
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
  user_id?: string;
  service_inquiry_responses?: any[];
  service_inquiry_conversations?: any[];
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
  const [showCompletedServices, setShowCompletedServices] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestTitle, setSelectedRequestTitle] = useState<string>("");
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedServiceResponse, setSelectedServiceResponse] = useState<ServiceInquiry | null>(null);
  const [serviceResponseDialogOpen, setServiceResponseDialogOpen] = useState(false);
  const [selectedInquiryForReply, setSelectedInquiryForReply] = useState<ServiceInquiry | null>(null);
  const [inquiryReplyDialogOpen, setInquiryReplyDialogOpen] = useState(false);
  const [selectedInquiryForUserReply, setSelectedInquiryForUserReply] = useState<ServiceInquiry | null>(null);
  const [userReplyDialogOpen, setUserReplyDialogOpen] = useState(false);
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

      const messagesChannel = supabase
        .channel('service-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_request_messages',
          },
          () => {
            console.log('New message received, refreshing data...');
            fetchServiceResponses();
            fetchReceivedMessages();
            fetchMyServiceRequests();
          }
        )
        .subscribe();

      const conversationsChannel = supabase
        .channel('service-conversations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_inquiry_conversations',
          },
          () => {
            console.log('New conversation message received, refreshing data...');
            fetchServiceResponses();
            fetchReceivedMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(responseChannel);
        supabase.removeChannel(inquiryChannel);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(conversationsChannel);
      };
    }
  }, [user]);

  const fetchServiceResponses = async () => {
    try {
      if (profile?.account_type === 'company') {
        // For companies, fetch their sent responses with request details AND messages
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
        
        // Format the responses to include request details and fetch related messages
        const formattedResponses = await Promise.all(
          (data || []).map(async (response) => {
            // Fetch messages for this service request
            const { data: messagesData } = await supabase
              .from('service_request_messages')
              .select('*')
              .eq('request_id', response.request_id)
              .order('created_at', { ascending: false });

            return {
              ...response,
              request_details: response.service_inquiries,
              messages: messagesData || [],
              status_display: response.response_status || 'pending'
            };
          })
        );
        
        setServiceResponses(formattedResponses);
      } else {
        // For users, fetch service inquiries with responses and conversations
        const { data, error } = await supabase
          .from('service_inquiries')
          .select(`
            *,
            service_inquiry_responses (
              id,
              response_message,
              contact_email,
              contact_phone,
              created_at,
              company_id,
              profiles:company_id (
                display_name,
                company_name
              )
            ),
            service_inquiry_conversations (
              id,
              sender_id,
              sender_type,
              message,
              created_at
            )
          `)
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
        // For companies, fetch service inquiries for their services with conversation history
        const { data: serviceInquiriesData, error: inquiriesError } = await supabase
          .from('service_inquiries')
          .select(`
            *,
            services!inner (
              name,
              user_id
            ),
            service_inquiry_conversations (
              id,
              sender_id,
              sender_type,
              message,
              created_at
            ),
            service_inquiry_responses (
              id,
              response_message,
              contact_email,
              contact_phone,
              created_at
            )
          `)
          .eq('services.user_id', user?.id)
          .eq('inquiry_type', 'contact')
          .order('created_at', { ascending: false });

        if (inquiriesError) throw inquiriesError;

        // Also fetch messages from service_request_messages table
        const { data: messagesData, error: messagesError } = await supabase
          .from('service_request_messages')
          .select('*')
          .eq('recipient_id', user?.id)
          .eq('message_type', 'user_to_company')
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        
        // Get sender profiles for service request messages
        const messagesWithProfiles = await Promise.all(
          (messagesData || []).map(async (msg) => {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('display_name, contact_email')
              .eq('user_id', msg.sender_id)
              .single();
            
            return {
              id: msg.id,
              inquirer_name: senderProfile?.display_name || 'User',
              inquirer_email: senderProfile?.contact_email || '',
              inquirer_phone: '',
              message: msg.message,
              inquiry_type: 'contact',
              created_at: msg.created_at,
              service_id: null
            };
          })
        );

        // Combine service inquiries with service request messages
        const allMessages = [
          ...(serviceInquiriesData || []),
          ...messagesWithProfiles
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setReceivedMessages(allMessages);
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

      // Get response counts and messages for each request
      const requestsWithData = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: responsesData, error: responsesError } = await supabase
            .from('service_request_responses')
            .select('id')
            .eq('request_id', request.id);

          if (responsesError) throw responsesError;

          // Also fetch messages for this request
          const { data: messagesData } = await supabase
            .from('service_request_messages')
            .select('*')
            .eq('request_id', request.id)
            .order('created_at', { ascending: false });

          return {
            ...request,
            response_count: responsesData?.length || 0,
            messages: messagesData || []
          };
        })
      );

      setMyServiceRequests(requestsWithData);
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
    <div className="min-h-screen bg-background pb-16 md:pb-0">
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
          <Tabs defaultValue="received-inquiries" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="received-inquiries">
                <HelpCircle className="h-4 w-4 mr-2" />
                Received Inquiries ({receivedMessages.length})
              </TabsTrigger>
              <TabsTrigger value="sent-responses">
                <MessageSquare className="h-4 w-4 mr-2" />
                Sent Responses ({serviceResponses.length})
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <Star className="h-4 w-4 mr-2" />
                Customer Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received-inquiries">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Received Service Inquiries
                  </CardTitle>
                  <CardDescription>
                    Service inquiries and contact messages from customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {receivedMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No inquiries received yet</p>
                        <p className="text-sm">When customers contact you through your services, their messages will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {receivedMessages.map((inquiry) => (
                          <div
                            key={inquiry.id}
                            className="p-4 border rounded-lg hover:bg-accent/50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Customer Inquiry</span>
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.inquiry_type}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium">From: {inquiry.inquirer_name}</p>
                              {inquiry.inquirer_email && (
                                <p className="text-sm text-muted-foreground">Email: {inquiry.inquirer_email}</p>
                              )}
                              {inquiry.inquirer_phone && (
                                <p className="text-sm text-muted-foreground">Phone: {inquiry.inquirer_phone}</p>
                              )}
                              
                              {/* Original User Message */}
                              <div className="bg-blue-50 p-3 rounded border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Customer Message:</p>
                                <p className="text-sm">{inquiry.message}</p>
                              </div>

                              {/* Company Response */}
                              {inquiry.service_inquiry_responses && inquiry.service_inquiry_responses.length > 0 && (
                                <div className="space-y-2">
                                  {inquiry.service_inquiry_responses.map((response: any) => (
                                    <div
                                      key={response.id}
                                      className="bg-green-50 p-3 rounded border border-green-200 dark:bg-green-950 dark:border-green-800"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-green-800 dark:text-green-300">
                                          Your Response:
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-sm">{response.response_message}</p>
                                      {(response.contact_email || response.contact_phone) && (
                                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                                          <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Contact Details Provided:</p>
                                          {response.contact_email && (
                                            <p className="text-xs text-muted-foreground">Email: {response.contact_email}</p>
                                          )}
                                          {response.contact_phone && (
                                            <p className="text-xs text-muted-foreground">Phone: {response.contact_phone}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Conversation History */}
                              {inquiry.service_inquiry_conversations && inquiry.service_inquiry_conversations.length > 0 && (
                                <div className="space-y-2 mt-3">
                                  <div className="text-xs font-medium text-muted-foreground border-t pt-2">
                                    Conversation History:
                                  </div>
                                  {inquiry.service_inquiry_conversations
                                    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                    .map((message: any) => (
                                    <div
                                      key={message.id}
                                      className={`p-3 rounded border ${
                                        message.sender_type === 'user'
                                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 mr-4'
                                          : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 ml-4'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <p className={`text-xs font-medium ${
                                          message.sender_type === 'user'
                                            ? 'text-blue-800 dark:text-blue-300'
                                            : 'text-green-800 dark:text-green-300'
                                        }`}>
                                          {message.sender_type === 'user' ? 'Customer' : 'You'}:
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-sm">{message.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex justify-end pt-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInquiryForReply(inquiry);
                                    setInquiryReplyDialogOpen(true);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Reply className="h-4 w-4" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

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
                            className="p-4 border rounded-lg"
                          >
                            {/* Service Response Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Service Response</span>
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
                                {response.messages && response.messages.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {response.messages.length} message{response.messages.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                              </span>
                            </div>

                            {/* Service Response Content */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {isServiceResponse(response) ? response.response_message : response.message}
                            </p>

                            {/* Request Details */}
                            {response.request_details && (
                              <div className="mb-3 p-3 bg-muted/30 rounded-md">
                                <div className="text-xs font-medium text-muted-foreground mb-1">Original Request from {response.request_details.inquirer_name}</div>
                                <p className="text-sm line-clamp-2">{response.request_details.message}</p>
                              </div>
                            )}

                            {/* Messages Section */}
                            {response.messages && response.messages.length > 0 && (
                              <div className="mt-4 space-y-2 border-t pt-3">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Messages:</div>
                                {response.messages.slice(0, 3).map((message) => (
                                  <div
                                    key={message.id}
                                    className="p-2 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium">
                                        {message.message_type === 'user_to_company' ? 'From User' : 'From Company'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm line-clamp-2">{message.message}</p>
                                  </div>
                                ))}
                                {response.messages.length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    + {response.messages.length - 3} more message{response.messages.length - 3 > 1 ? 's' : ''}
                                  </div>
                                )}
                                
                                {/* Reply Button */}
                                <div className="mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleResponseClick({
                                      id: response.id,
                                      inquirer_name: response.request_details?.inquirer_name || 'User',
                                      inquirer_email: response.request_details?.inquirer_email || '',
                                      inquirer_phone: '',
                                      message: response.response_message || '',
                                      inquiry_type: 'contact',
                                      created_at: response.created_at,
                                      service_id: '',
                                      user_id: response.request_details?.user_id
                                    })}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Reply to Conversation
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Reply Button for responses without messages */}
                            {(!response.messages || response.messages.length === 0) && (
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleResponseClick({
                                    id: response.id,
                                    inquirer_name: response.request_details?.inquirer_name || 'User',
                                    inquirer_email: response.request_details?.inquirer_email || '',
                                    inquirer_phone: '',
                                    message: response.response_message || '',
                                    inquiry_type: 'contact',
                                    created_at: response.created_at,
                                    service_id: '',
                                    user_id: response.request_details?.user_id
                                  })}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Start Conversation
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback">
              <CompanyFeedbackManagement />
            </TabsContent>

          </Tabs>
        ) : (
          // User view
          <Tabs defaultValue="service-inquiries" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="service-inquiries">
                <MessageSquare className="h-4 w-4 mr-2" />
                My Service Inquiries ({serviceResponses.length})
              </TabsTrigger>
              <TabsTrigger value="service-requests">
                <HelpCircle className="h-4 w-4 mr-2" />
                My Service Requests
              </TabsTrigger>
              <TabsTrigger value="my-feedback">
                <ThumbsUp className="h-4 w-4 mr-2" />
                My Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="service-inquiries">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    My Service Inquiries
                  </CardTitle>
                  <CardDescription>
                    Service inquiries you've sent and company responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {serviceResponses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No service inquiries yet</p>
                        <p className="text-sm">When you contact companies through their services, your inquiries will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {serviceResponses.map((inquiry) => (
                          <div
                            key={inquiry.id}
                            className="p-4 border rounded-lg hover:bg-accent/50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Service Inquiry</span>
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.inquiry_type}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="bg-blue-50 p-3 rounded border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Your Message:</p>
                                <p className="text-sm">{inquiry.message}</p>
                              </div>
                              
                              {/* Complete Conversation History */}
                              {inquiry.service_inquiry_responses && inquiry.service_inquiry_responses.length > 0 ? (
                                <div className="space-y-2">
                                  {/* Company Initial Response */}
                                  {inquiry.service_inquiry_responses.map((response: any) => (
                                    <div
                                      key={response.id}
                                      className="bg-green-50 p-3 rounded border border-green-200 dark:bg-green-950 dark:border-green-800"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-green-800 dark:text-green-300">
                                          Company Response from {response.profiles?.company_name || response.profiles?.display_name || 'Company'}:
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-sm">{response.response_message}</p>
                                      {(response.contact_email || response.contact_phone) && (
                                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                                          <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Contact Details:</p>
                                          {response.contact_email && (
                                            <p className="text-xs text-muted-foreground">Email: {response.contact_email}</p>
                                          )}
                                          {response.contact_phone && (
                                            <p className="text-xs text-muted-foreground">Phone: {response.contact_phone}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {/* Conversation Messages */}
                                  {inquiry.service_inquiry_conversations && inquiry.service_inquiry_conversations.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                      <div className="text-xs font-medium text-muted-foreground border-t pt-2">
                                        Conversation History:
                                      </div>
                                      {inquiry.service_inquiry_conversations
                                        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                        .map((message: any) => (
                                        <div
                                          key={message.id}
                                          className={`p-3 rounded border ${
                                            message.sender_type === 'user'
                                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 ml-4'
                                              : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 mr-4'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <p className={`text-xs font-medium ${
                                              message.sender_type === 'user'
                                                ? 'text-blue-800 dark:text-blue-300'
                                                : 'text-green-800 dark:text-green-300'
                                            }`}>
                                              {message.sender_type === 'user' ? 'You' : 'Company'}:
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                            </span>
                                          </div>
                                          <p className="text-sm">{message.message}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between pt-2">
                                    <div className="text-xs text-green-600 font-medium">
                                      ✓ Company has responded to your inquiry
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedInquiryForUserReply(inquiry);
                                        setUserReplyDialogOpen(true);
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <Reply className="h-4 w-4" />
                                      Reply
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground mt-2">
                                  Status: Awaiting company response
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

            <TabsContent value="service-requests">
              <div className="w-full space-y-6">
                {/* Completed Services Section - Moved to Top */}
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
                            <p className="text-sm">No completed services yet - services need to be marked as completed by companies</p>
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
              </div>
            </TabsContent>

            <TabsContent value="my-feedback">
              <UserFeedbackReceived />
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

        {/* Service Inquiry Reply Dialog */}
        {selectedInquiryForReply && (
          <ServiceInquiryReplyDialog
            inquiry={selectedInquiryForReply}
            open={inquiryReplyDialogOpen}
            onOpenChange={setInquiryReplyDialogOpen}
            onReplySent={() => {
              fetchReceivedMessages();
              fetchServiceResponses();
            }}
          />
        )}

        {/* User Reply Dialog */}
        {selectedInquiryForUserReply && (
          <UserReplyDialog
            inquiry={selectedInquiryForUserReply}
            open={userReplyDialogOpen}
            onOpenChange={setUserReplyDialogOpen}
            onReplySent={() => {
              fetchServiceResponses();
              fetchReceivedMessages();
            }}
          />
        )}
      </div>
      <MobileNavigation />
    </div>
  );
};

export default ServiceManagement;