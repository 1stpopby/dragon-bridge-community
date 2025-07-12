import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Building2, Settings, MessageSquare, Bell, Save, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [soldItems, setSoldItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    contact_email: profile?.contact_email || '',
    account_type: profile?.account_type || 'user'
  });

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') || 'profile';
    setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        contact_email: profile.contact_email || '',
        account_type: profile.account_type || 'user'
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchNotifications();
      fetchMarketplaceItems();
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

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMarketplaceItems = async () => {
    if (!user) return;

    try {
      // Fetch active items
      const { data: activeData, error: activeError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;
      setActiveItems(activeData || []);

      // Fetch sold items
      const { data: soldData, error: soldError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .order('created_at', { ascending: false });

      if (soldError) throw soldError;
      setSoldItems(soldData || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Profile updated successfully
      
      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="Your display name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Your phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select value={formData.account_type} onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Individual User</SelectItem>
                        <SelectItem value="company">Company/Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.account_type === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="Your company name"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Your private messages from other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
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
                              <span className="font-medium">
                                {message.sender_profile?.display_name || 'Unknown User'}
                              </span>
                              {!message.is_read && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <h4 className="font-medium mb-2">{message.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
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

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  Your latest activity notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border rounded-lg ${
                            notification.is_read ? 'opacity-60' : 'bg-primary/5 border-primary/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.content}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-1" />
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

          <TabsContent value="marketplace">
            <div className="space-y-6">
              {/* Active Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Listings ({activeItems.length})</CardTitle>
                  <CardDescription>
                    Your items currently available for sale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active listings</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeItems.map((item) => (
                        <MarketplaceCard
                          key={item.id}
                          item={item}
                          onItemChanged={fetchMarketplaceItems}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sold Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Sold Items ({soldItems.length})</CardTitle>
                  <CardDescription>
                    Your items that have been sold
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {soldItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sold items yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {soldItems.map((item) => (
                        <MarketplaceCard
                          key={item.id}
                          item={item}
                          onItemChanged={fetchMarketplaceItems}
                          showActions={false}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;