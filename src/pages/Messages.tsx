import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Building2, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

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

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [serviceResponses, setServiceResponses] = useState<ServiceInquiry[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceInquiry[]>([]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchServiceResponses();
      fetchMyRequests();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchServiceResponses = async () => {
    if (!user) return;

    try {
      // Fetch responses to user's service requests
      const { data, error } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('inquiry_type', 'contact')
        .neq('service_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter responses that are related to services owned by the current user
      // or responses to the current user's requests
      const filteredResponses = data?.filter(inquiry => 
        inquiry.inquirer_email !== user.email && // Don't show user's own inquiries
        (inquiry.message.includes('Response to service request') || 
         inquiry.inquirer_name !== 'Service Provider') // Show company responses
      ) || [];

      setServiceResponses(filteredResponses);
    } catch (error) {
      console.error('Error fetching service responses:', error);
    }
  };

  const fetchMyRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('user_id', user.id)
        .eq('inquiry_type', 'request_service')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, is_read: true } : msg)
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Your private messages and service communications</p>
          </div>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages">
              Private Messages ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="responses">
              Service Responses ({serviceResponses.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              My Requests ({myRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Private Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Private Messages
                </CardTitle>
                <CardDescription>
                  Direct messages from other community members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No messages yet</p>
                      <p className="text-sm">When someone sends you a direct message, it will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            message.is_read ? 'bg-background' : 'bg-primary/5 border-primary/20'
                          }`}
                          onClick={() => !message.is_read && markMessageAsRead(message.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Private Message</span>
                              {!message.is_read && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <h4 className="font-medium mb-2">{message.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {message.content}
                          </p>
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
                            className="p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  My Service Requests
                </CardTitle>
                <CardDescription>
                  Service requests you've submitted to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {myRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No service requests yet</p>
                      <p className="text-sm">When you request services, they'll appear here for tracking</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 border rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Service Request</span>
                              <Badge variant="outline" className="text-xs">Submitted</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
                            {request.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Messages;