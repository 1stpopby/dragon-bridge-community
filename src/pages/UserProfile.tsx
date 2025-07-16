import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, MessageSquare, Mail, User, Building2, ArrowLeft, MessageCircle, FileText, Reply, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  account_type: string;
  company_name: string | null;
  created_at: string;
  is_verified: boolean | null;
}

interface UserStats {
  forum_posts: number;
  forum_replies: number;
  regular_posts: number;
  post_comments: number;
  total_posts: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        }
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;
    
    try {
      // Get forum posts count
      const { count: forumPostsCount } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get forum replies count
      const { count: forumRepliesCount } = await supabase
        .from('forum_replies')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get regular posts count
      const { count: regularPostsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get post comments count
      const { count: postCommentsCount } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      const stats: UserStats = {
        forum_posts: forumPostsCount || 0,
        forum_replies: forumRepliesCount || 0,
        regular_posts: regularPostsCount || 0,
        post_comments: postCommentsCount || 0,
        total_posts: (forumPostsCount || 0) + (forumRepliesCount || 0) + (regularPostsCount || 0) + (postCommentsCount || 0)
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">User Not Found</h1>
            <p className="text-lg text-muted-foreground mb-8">
              The user you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => navigate("/")} variant="default">
              Go Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = currentUser.id === userProfile.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage src={userProfile.avatar_url || ""} alt={userProfile.display_name} />
                <AvatarFallback className="text-xl">
                  {getInitials(userProfile.display_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start">
                      {userProfile.display_name}
                      {userProfile.is_verified && (
                        <Badge variant="secondary" className="ml-2">
                          <Building2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-4 text-muted-foreground">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span className="capitalize">{userProfile.account_type}</span>
                      </div>
                      
                      {userProfile.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{userProfile.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Joined {formatDate(userProfile.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isOwnProfile && (
                    <div className="mt-4 md:mt-0">
                      <Button 
                        onClick={() => setShowMessageDialog(true)}
                        className="w-full md:w-auto"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  )}
                </div>
                
                {userProfile.company_name && (
                  <div className="mt-2">
                    <Badge variant="outline" className="flex items-center w-fit mx-auto md:mx-0">
                      <Building2 className="h-3 w-3 mr-1" />
                      {userProfile.company_name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bio Section */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userProfile.bio ? (
                  <p className="text-muted-foreground leading-relaxed">{userProfile.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic">No bio available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userStats && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Posts</span>
                      <Badge variant="secondary">{userStats.total_posts}</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">Forum Posts</span>
                        </div>
                        <span className="text-sm font-medium">{userStats.forum_posts}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Reply className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm">Forum Replies</span>
                        </div>
                        <span className="text-sm font-medium">{userStats.forum_replies}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="text-sm">Feed Posts</span>
                        </div>
                        <span className="text-sm font-medium">{userStats.regular_posts}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-red-500" />
                          <span className="text-sm">Comments</span>
                        </div>
                        <span className="text-sm font-medium">{userStats.post_comments}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Message Dialog */}
      {!isOwnProfile && (
        <SendMessageDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          recipientId={userProfile.user_id}
          recipientName={userProfile.display_name}
        />
      )}

      <Footer />
    </div>
  );
};

export default UserProfile; 