import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Plus,
  Send,
  Lock,
  Loader2,
  MapPin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  member_count: number;
  organizer_name: string;
  image_url: string | null;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  user_id: string;
  created_at: string;
  replies_count: number;
  likes_count: number;
}

interface Reply {
  id: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  user_id: string;
  created_at: string;
}

const GroupForum = () => {
  const { groupId } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
      if (user) {
        checkMembership();
      }
    }
  }, [groupId, user]);

  const fetchGroupData = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('community_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch discussions if user is logged in (RLS will handle access control)
      if (user) {
        const { data: discussionsData, error: discussionsError } = await supabase
          .from('group_discussions')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (discussionsError && discussionsError.code !== 'PGRST116') {
          throw discussionsError;
        }
        setDiscussions(discussionsData || []);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast({
        title: "Error loading group",
        description: "Failed to load group information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      setIsMember(!!data);
    } catch (error) {
      setIsMember(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !profile) return;

    try {
      setMembershipLoading(true);
      const { error } = await supabase
        .from('group_memberships')
        .insert([{
          group_id: groupId,
          member_name: profile.display_name,
          user_id: user.id
        }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already a member",
            description: "You are already a member of this group.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Successfully joined group!",
          description: `Welcome to ${group?.name}!`,
        });
        setIsMember(true);
        fetchGroupData();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining group",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!user || !profile || !newDiscussionTitle.trim() || !newDiscussionContent.trim()) return;

    try {
      const { error } = await supabase
        .from('group_discussions')
        .insert([{
          group_id: groupId,
          title: newDiscussionTitle.trim(),
          content: newDiscussionContent.trim(),
          author_name: profile.display_name,
          author_avatar: profile.avatar_url,
          user_id: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Discussion created!",
        description: "Your discussion has been posted to the group.",
      });

      setNewDiscussionTitle("");
      setNewDiscussionContent("");
      setShowNewDiscussion(false);
      fetchGroupData();
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast({
        title: "Error creating discussion",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!group) {
    return <Navigate to="/community" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/community" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {group.image_url ? (
                <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <Badge variant="outline">{group.category}</Badge>
                {isMember && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Users className="h-3 w-3 mr-1" />
                    Member
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {group.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {group.member_count} members
                </div>
              </div>
              
              {group.description && (
                <p className="text-muted-foreground">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Access Control */}
        {!user ? (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Private Group Forum</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in to join this group and access private discussions.
                </p>
                <Button asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isMember ? (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Members Only</h3>
                <p className="text-muted-foreground mb-4">
                  Join this group to access private discussions and connect with members.
                </p>
                <Button onClick={handleJoinGroup} disabled={membershipLoading}>
                  {membershipLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Join Group
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Forum Content */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Group Discussions</h2>
              <Button onClick={() => setShowNewDiscussion(!showNewDiscussion)}>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </div>

            {/* New Discussion Form */}
            {showNewDiscussion && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Start a New Discussion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Discussion title..."
                    value={newDiscussionTitle}
                    onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="What would you like to discuss?"
                    value={newDiscussionContent}
                    onChange={(e) => setNewDiscussionContent(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateDiscussion}
                      disabled={!newDiscussionTitle.trim() || !newDiscussionContent.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Discussion
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewDiscussion(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discussions List */}
            {discussions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to start a discussion in this group!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={discussion.author_avatar || undefined} alt={discussion.author_name} />
                          <AvatarFallback>
                            {discussion.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{discussion.title}</h3>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <span>{discussion.author_name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{discussion.content}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {discussion.replies_count} replies
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupForum;