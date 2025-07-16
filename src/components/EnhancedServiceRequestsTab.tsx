import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  User,
  AlertCircle,
  CheckCircle,
  Star,
  Building2,
  DollarSign,
  Calendar,
  Target,
  Send,
  Eye,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ServiceRequest {
  id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string | null;
  message: string;
  inquiry_type: string;
  service_id: string | null;
  status: string;
  responses_count: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  match_score?: number;
}

interface ServiceResponse {
  id: string;
  request_id: string;
  company_id: string;
  response_message: string;
  contact_email: string | null;
  contact_phone: string | null;
  estimated_cost: string | null;
  availability: string | null;
  response_status: string;
  created_at: string;
  company_name?: string;
}

interface EnhancedServiceRequestsTabProps {
  searchTerm: string;
}

export function EnhancedServiceRequestsTab({ searchTerm }: EnhancedServiceRequestsTabProps) {
  const [matchedRequests, setMatchedRequests] = useState<ServiceRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [myResponses, setMyResponses] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matched");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseData, setResponseData] = useState({
    response_message: '',
    contact_email: '',
    contact_phone: '',
    estimated_cost: '',
    availability: '',
    response_status: 'pending'
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile?.account_type === 'company') {
      fetchServiceRequests();
      fetchMyResponses();

      // Set up real-time subscription for service request updates
      const channel = supabase
        .channel('enhanced-service-requests-updates')
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
            fetchMyResponses();
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
            fetchMyResponses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const fetchServiceRequests = async () => {
    if (!user || !profile) return;
    
    try {
      setLoading(true);
      
      // Fetch all service requests for browsing
      const { data: allData, error: allError } = await supabase
        .from('service_inquiries')
        .select('*')
        .eq('inquiry_type', 'request_service')
        .order('created_at', { ascending: false });

      if (allError) throw allError;
      setAllRequests(allData || []);

      // For now, we'll use the same data for matched requests
      // In a real app, you might implement a matching algorithm
      setMatchedRequests(allData || []);

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

  const fetchMyResponses = async () => {
    if (!user || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from('service_request_responses')
        .select(`
          *,
          service_inquiries!inner (
            inquirer_name,
            inquirer_email,
            category,
            location,
            created_at
          )
        `)
        .eq('company_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const responses = data?.map(item => ({
        ...item,
        company_name: profile.company_name || profile.display_name
      })) || [];

      setMyResponses(responses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const filterRequests = (requests: ServiceRequest[]) => {
    return requests.filter(request => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        request.inquirer_name.toLowerCase().includes(searchLower) ||
        request.message.toLowerCase().includes(searchLower) ||
        request.inquiry_type.toLowerCase().includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower)
      );
    });
  };

  const handleRespond = async (requestId: string) => {
    if (!responseData.response_message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a response message.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) return;

    try {
      const { error } = await supabase
        .from('service_request_responses')
        .insert({
          request_id: requestId,
          company_id: profile.id,
          response_message: responseData.response_message,
          contact_email: responseData.contact_email || profile.contact_email,
          contact_phone: responseData.contact_phone || profile.company_phone,
          estimated_cost: responseData.estimated_cost,
          availability: responseData.availability,
          response_status: responseData.response_status
        });

      if (error) throw error;

      toast({
        title: "Response sent!",
        description: "Your response has been sent to the requester.",
      });

      setRespondingTo(null);
      setResponseData({
        response_message: '',
        contact_email: '',
        contact_phone: '',
        estimated_cost: '',
        availability: '',
        response_status: 'pending'
      });

      // Refresh data
      fetchServiceRequests();
      fetchMyResponses();

    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Error sending response",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (priority?.toLowerCase()) {
      case 'completed': return 'default';
      case 'accepted': return 'secondary';
      case 'declined': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'accepted': return 'secondary';
      case 'declined': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const parseRequestDetails = (message: string) => {
    const lines = message.split('\n');
    const details: any = {};
    
    lines.forEach(line => {
      if (line.includes('Service Type:')) details.serviceType = line.split('Service Type:')[1]?.trim();
    });
    
    const descriptionStart = message.indexOf('Description:');
    if (descriptionStart !== -1) {
      details.description = message.substring(descriptionStart + 12).trim();
    }
    
    return details;
  };

  const formatTimeAgo = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const hasResponded = (requestId: string) => {
    return myResponses.some(response => response.request_id === requestId);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading service requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matched" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Matched Requests ({matchedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Browse All ({allRequests.length})
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Responses ({myResponses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matched">
          <ServiceRequestList 
            requests={filterRequests(matchedRequests)}
            searchTerm={searchTerm}
            onRespond={handleRespond}
            respondingTo={respondingTo}
            setRespondingTo={setRespondingTo}
            responseData={responseData}
            setResponseData={setResponseData}
            hasResponded={hasResponded}
            showMatchScore={true}
            parseRequestDetails={parseRequestDetails}
            getPriorityColor={getPriorityColor}
          />
        </TabsContent>

        <TabsContent value="all">
          <ServiceRequestList 
            requests={filterRequests(allRequests)}
            searchTerm={searchTerm}
            onRespond={handleRespond}
            respondingTo={respondingTo}
            setRespondingTo={setRespondingTo}
            responseData={responseData}
            setResponseData={setResponseData}
            hasResponded={hasResponded}
            showMatchScore={false}
            parseRequestDetails={parseRequestDetails}
            getPriorityColor={getPriorityColor}
          />
        </TabsContent>

        <TabsContent value="responses">
          <MyResponsesList responses={myResponses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ServiceRequestListProps {
  requests: ServiceRequest[];
  searchTerm: string;
  onRespond: (requestId: string) => void;
  respondingTo: string | null;
  setRespondingTo: (id: string | null) => void;
  responseData: any;
  setResponseData: (data: any) => void;
  hasResponded: (requestId: string) => boolean;
  showMatchScore: boolean;
  parseRequestDetails: (message: string) => any;
  getPriorityColor: (priority: string) => "default" | "destructive" | "secondary" | "outline";
}

function ServiceRequestList({ 
  requests, 
  searchTerm, 
  onRespond, 
  respondingTo, 
  setRespondingTo, 
  responseData, 
  setResponseData, 
  hasResponded,
  showMatchScore,
  parseRequestDetails,
  getPriorityColor
}: ServiceRequestListProps) {
  const { profile } = useAuth();

  if (requests.length === 0) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {requests.map((request) => {
        const details = parseRequestDetails(request.message);
        const alreadyResponded = hasResponded(request.id);
        
        return (
          <Card key={request.id} className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{request.inquiry_type}</Badge>
                  <Badge variant={getPriorityColor(request.status)}>
                    {request.status}
                  </Badge>
                  {showMatchScore && request.match_score && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Star className="h-3 w-3 mr-1" />
                      {request.match_score}% match
                    </Badge>
                  )}
                  {alreadyResponded && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Responded
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
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

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{request.inquirer_email}</span>
                </div>
                {request.inquirer_phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{request.inquirer_phone}</span>
                  </div>
                )}
              </div>

              {details.description && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-line">{details.description}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{request.responses_count} responses</span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      disabled={alreadyResponded}
                      onClick={() => {
                        setRespondingTo(request.id);
                        setResponseData(prev => ({
                          ...prev,
                          contact_email: profile?.contact_email || '',
                          contact_phone: profile?.company_phone || ''
                        }));
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {alreadyResponded ? 'Already Responded' : 'Send Response'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Respond to Service Request</DialogTitle>
                      <DialogDescription>
                        Send a professional response to {request.inquirer_name}'s service request.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="response_message">Response Message *</Label>
                        <Textarea
                          id="response_message"
                          value={responseData.response_message}
                          onChange={(e) => setResponseData(prev => ({ ...prev, response_message: e.target.value }))}
                          placeholder="Describe how you can help with this request..."
                          rows={4}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact_email">Contact Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={responseData.contact_email}
                            onChange={(e) => setResponseData(prev => ({ ...prev, contact_email: e.target.value }))}
                            placeholder="Your contact email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_phone">Contact Phone</Label>
                          <Input
                            id="contact_phone"
                            value={responseData.contact_phone}
                            onChange={(e) => setResponseData(prev => ({ ...prev, contact_phone: e.target.value }))}
                            placeholder="Your contact phone"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="estimated_cost">Estimated Cost</Label>
                          <Input
                            id="estimated_cost"
                            value={responseData.estimated_cost}
                            onChange={(e) => setResponseData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                            placeholder="e.g., £500-1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="availability">Availability</Label>
                          <Input
                            id="availability"
                            value={responseData.availability}
                            onChange={(e) => setResponseData(prev => ({ ...prev, availability: e.target.value }))}
                            placeholder="e.g., Available next week"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setRespondingTo(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => onRespond(request.id)}
                        >
                          Send Response
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface MyResponsesListProps {
  responses: ServiceResponse[];
}

function MyResponsesList({ responses }: MyResponsesListProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'accepted': return 'secondary';
      case 'declined': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No responses sent yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <Card key={response.id} className="border-border">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Response to {(response as any).service_inquiries?.inquirer_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {(response as any).service_inquiries?.category} • {(response as any).service_inquiries?.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(response.response_status)}>
                  {response.response_status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-line">{response.response_message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {response.contact_email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.contact_email}</span>
                </div>
              )}
              {response.contact_phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.contact_phone}</span>
                </div>
              )}
              {response.estimated_cost && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.estimated_cost}</span>
                </div>
              )}
              {response.availability && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{response.availability}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 