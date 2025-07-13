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
  MapPin,
  Crown,
  Heart,
  ThumbsUp,
  Smile,
  Star
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

interface Reaction {
  id: string;
  emoji: string;
  author_name: string;
  user_id: string | null;
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
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});

  const availableEmojis = [
    { emoji: "👍", name: "thumbs up" },
    { emoji: "❤️", name: "heart" },
    { emoji: "😊", name: "smile" },
    { emoji: "⭐", name: "star" },
    { emoji: "🔥", name: "fire" },
    { emoji: "👏", name: "clap" }
  ];

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
      setTimeout(() => fetchReactions(), 500); // Fetch reactions after discussions are loaded
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
        // Fetch reactions after discussions are loaded
        setTimeout(() => fetchReactions(), 100);
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

  const fetchReactions = async () => {
    if (!user || discussions.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('group_discussion_reactions')
        .select('*')
        .in('discussion_id', discussions.map(d => d.id));

      if (error && error.code !== 'PGRST116') throw error;

      // Group reactions by discussion_id
      const reactionsByDiscussion: Record<string, Reaction[]> = {};
      (data || []).forEach((reaction) => {
        if (!reactionsByDiscussion[reaction.discussion_id]) {
          reactionsByDiscussion[reaction.discussion_id] = [];
        }
        reactionsByDiscussion[reaction.discussion_id].push(reaction);
      });

      setReactions(reactionsByDiscussion);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (discussionId: string, emoji: string) => {
    if (!user || !profile) return;

    try {
      const discussionReactions = reactions[discussionId] || [];
      const existingReaction = discussionReactions.find(r => 
        r.emoji === emoji && 
        (user ? r.user_id === user.id : r.author_name === profile.display_name)
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('group_discussion_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('group_discussion_reactions')
          .insert({
            discussion_id: discussionId,
            user_id: user?.id || null,
            author_name: profile?.display_name || 'Anonymous',
            emoji: emoji
          });

        if (error) throw error;
      }

      // Refresh reactions
      fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Error updating reaction",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getReactionCount = (discussionId: string, emoji: string) => {
    const discussionReactions = reactions[discussionId] || [];
    return discussionReactions.filter(r => r.emoji === emoji).length;
  };

  const hasUserReacted = (discussionId: string, emoji: string) => {
    const discussionReactions = reactions[discussionId] || [];
    return discussionReactions.some(r => 
      r.emoji === emoji && 
      (user ? r.user_id === user.id : r.author_name === profile?.display_name)
    );
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
      setTimeout(() => fetchReactions(), 500); // Fetch reactions after discussions are loaded
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Professional Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-0 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <Link to="/community" className="inline-flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Link>
            
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0 shadow-lg">
                {group?.image_url ? (
                  <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{group?.name}</h1>
                  <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/30">
                    {group?.category}
                  </Badge>
                  {isMember && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      Member
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                    {group?.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-slate-400" />
                    {group?.member_count} members
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-slate-400" />
                    {discussions.length} discussions
                  </div>
                </div>
                
                {group?.description && (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{group.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Access Control */}
        {!user ? (
          <Card className="bg-white dark:bg-slate-900 border-0 shadow-lg rounded-xl mb-6">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Private Group Forum</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                  Join our exclusive community discussions. Sign in to access member-only conversations and connect with fellow members.
                </p>
                <Button asChild size="lg" className="rounded-xl shadow-lg">
                  <Link to="/auth">
                    <Users className="h-5 w-5 mr-2" />
                    Sign In to Join
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isMember ? (
          <Card className="bg-white dark:bg-slate-900 border-0 shadow-lg rounded-xl mb-6">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Crown className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Members Only</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                  This is an exclusive space for group members. Join our community to access private discussions and connect with fellow members.
                </p>
                <Button onClick={handleJoinGroup} disabled={membershipLoading} size="lg" className="rounded-xl shadow-lg">
                  {membershipLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5 mr-2" />
                      Join This Group
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Forum Content */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-0 overflow-hidden">
              <div className="border-b border-slate-100 dark:border-slate-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Group Discussions</h2>
                  <Button onClick={() => setShowNewDiscussion(!showNewDiscussion)} className="rounded-lg shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Discussion
                  </Button>
                </div>
              </div>

              {/* New Discussion Form */}
              {showNewDiscussion && (
                <div className="border-b border-slate-100 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Discussion title..."
                        value={newDiscussionTitle}
                        onChange={(e) => setNewDiscussionTitle(e.target.value)}
                        className="border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="What would you like to discuss with the group?"
                        value={newDiscussionContent}
                        onChange={(e) => setNewDiscussionContent(e.target.value)}
                        rows={4}
                        className="border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleCreateDiscussion}
                        disabled={!newDiscussionTitle.trim() || !newDiscussionContent.trim()}
                        className="rounded-lg"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Start Discussion
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewDiscussion(false)} className="rounded-lg">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Discussions List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {discussions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No discussions yet</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Be the first to start a meaningful conversation in this group!
                    </p>
                  </div>
                ) : (
                  discussions.map((discussion) => (
                    <div key={discussion.id} className="p-6 transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <div className="flex space-x-4">
                        <Avatar className="h-12 w-12 ring-2 ring-slate-100 dark:ring-slate-700">
                          <AvatarImage src={discussion.author_avatar || undefined} alt={discussion.author_name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                            {discussion.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          {/* Discussion Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                                {discussion.title}
                              </h3>
                              <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-medium">{discussion.author_name}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Discussion Content */}
                          <div className="mb-4">
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {discussion.content}
                            </p>
                          </div>

                          {/* Emoji Reactions */}
                          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                            {availableEmojis.map(({ emoji, name }) => {
                              const count = getReactionCount(discussion.id, emoji);
                              const hasReacted = hasUserReacted(discussion.id, emoji);
                              
                              return (
                                <Button
                                  key={emoji}
                                  variant={hasReacted ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleReaction(discussion.id, emoji)}
                                  className={`h-8 px-3 rounded-full transition-all duration-200 ${
                                    hasReacted 
                                      ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' 
                                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'
                                  }`}
                                >
                                  <span className="mr-1">{emoji}</span>
                                  {count > 0 && <span className="text-xs font-medium">{count}</span>}
                                </Button>
                              );
                            })}
                          </div>

                          {/* Discussion Stats */}
                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{discussion.replies_count} replies</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupForum;