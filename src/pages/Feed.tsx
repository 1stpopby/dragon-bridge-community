import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, UserPlus, Users, Flame, Eye, Bookmark, Heart, UserCheck } from "lucide-react";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked?: boolean;
}

interface TrendingTopic {
  hashtag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface SuggestedUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  followers_count: number;
  is_company: boolean;
  is_following?: boolean;
}

const Feed = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (user && postsData) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) throw likesError;

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        const postsWithLikeStatus = postsData.map(post => ({
          ...post,
          user_liked: likedPostIds.has(post.id)
        }));

        setPosts(postsWithLikeStatus);
      } else {
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error loading posts",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      const mockTrending: TrendingTopic[] = [
        { hashtag: "#ChineseCommunity", count: 245, trend: 'up' },
        { hashtag: "#UKLife", count: 189, trend: 'up' },
        { hashtag: "#Business", count: 167, trend: 'stable' },
        { hashtag: "#Events", count: 143, trend: 'up' },
        { hashtag: "#Networking", count: 128, trend: 'down' },
        { hashtag: "#London", count: 95, trend: 'stable' },
        { hashtag: "#Edinburgh", count: 78, trend: 'down' },
        { hashtag: "#Culture", count: 65, trend: 'stable' }
      ];
      
      setTrendingTopics(mockTrending);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
  };

  const fetchFollowedUsers = async () => {
    if (!user || !profile) return;
    
    try {
      const { data: follows, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', profile.id);

      if (error) throw error;

      const followedUserIds = new Set(follows?.map(f => f.following_id) || []);
      setFollowedUsers(followedUserIds);
    } catch (error) {
      console.error('Error fetching followed users:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .limit(5);

      if (error) throw error;

      const usersWithFollowers = users?.map(user => ({
        id: user.id,
        display_name: user.display_name,
        email: user.display_name || 'User',
        avatar_url: user.avatar_url,
        is_company: user.account_type === 'company',
        followers_count: Math.floor(Math.random() * 1000) + 50,
        is_following: followedUsers.has(user.id)
      })) || [];

      setSuggestedUsers(usersWithFollowers);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const fetchFollowingPosts = async () => {
    if (!user || !profile) return;
    
    setFollowingLoading(true);
    try {
      const followedProfileIds = Array.from(followedUsers);
      
      if (followedProfileIds.length === 0) {
        setFollowingPosts([]);
        return;
      }

      // First get the user_ids from the followed profile ids
      const { data: followedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .in('id', followedProfileIds);

      if (profilesError) throw profilesError;

      const followedUserIds = followedProfiles?.map(p => p.user_id) || [];
      
      if (followedUserIds.length === 0) {
        setFollowingPosts([]);
        return;
      }

      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (user && postsData) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) throw likesError;

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        const postsWithLikeStatus = postsData.map(post => ({
          ...post,
          user_liked: likedPostIds.has(post.id)
        }));

        setFollowingPosts(postsWithLikeStatus);
      } else {
        setFollowingPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error fetching following posts:', error);
      toast({
        title: "Error loading following posts",
        description: "Failed to load posts from followed users.",
        variant: "destructive",
      });
    } finally {
      setFollowingLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user || !profile) return;
    
    try {
      const { data: savedPostsData, error } = await supabase
        .from('saved_posts')
        .select(`
          post_id,
          posts (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const posts = savedPostsData?.map(sp => sp.posts).filter(Boolean) || [];
      
      if (posts.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) throw likesError;

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        const postsWithLikeStatus = posts.map(post => ({
          ...post,
          user_liked: likedPostIds.has(post.id)
        }));

        setSavedPosts(postsWithLikeStatus);
      } else {
        setSavedPosts([]);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  const handleSavePost = async (post: Post) => {
    if (!user || !profile) return;
    
    try {
      const isAlreadySaved = savedPosts.some(p => p.id === post.id);
      
      if (isAlreadySaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) throw error;

        setSavedPosts(prev => prev.filter(p => p.id !== post.id));
        toast({
          title: "Post unsaved",
          description: "Post removed from saved posts.",
        });
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: post.id
          });

        if (error) throw error;

        setSavedPosts(prev => [...prev, post]);
        toast({
          title: "Post saved",
          description: "Post saved for later!",
        });
      }
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
      toast({
        title: "Error",
        description: "Failed to update saved post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!user || !profile) return;
    
    try {
      const isCurrentlyFollowing = followedUsers.has(userId);
      
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', profile.id)
          .eq('following_id', userId);

        if (error) throw error;

        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        toast({
          title: "User unfollowed",
          description: "You have unfollowed this user.",
        });
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: profile.id,
            following_id: userId
          });

        if (error) throw error;

        setFollowedUsers(prev => new Set([...prev, userId]));

        toast({
          title: "User followed",
          description: "You are now following this user!",
        });
      }

      // Update the button state in suggested users
      setSuggestedUsers(prev => 
        prev.map(suggestedUser => 
          suggestedUser.id === userId 
            ? { ...suggestedUser, is_following: !isCurrentlyFollowing }
            : suggestedUser
        )
      );

      // Update following posts
      if (activeTab === 'following') {
        fetchFollowingPosts();
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchTrendingTopics();
      fetchFollowedUsers();
      fetchSavedPosts();
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestedUsers();
  }, [followedUsers]);

  useEffect(() => {
    if (activeTab === 'following') {
      fetchFollowingPosts();
    } else if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  }, [activeTab, followedUsers, posts]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Trending Topics */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.hashtag} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{topic.hashtag}</p>
                        <p className="text-xs text-muted-foreground">{topic.count} posts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(topic.trend)}
                      <span className={`text-xs font-medium ${getTrendColor(topic.trend)}`}>
                        {topic.trend === 'up' ? '+18%' : topic.trend === 'down' ? '-14%' : '8%'}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  View all trending
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
            {/* Advertisement Section */}
            <AdvertisementBanner 
              location="feed" 
              variant="banner" 
              maxAds={1}
            />
            
            <AnnouncementBanner />
            
            {/* Feed Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="following">
                  <Heart className="h-4 w-4 mr-1" />
                  Following
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Saved
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-6 mt-6">
                <CreatePost onPostCreated={handlePostCreated} />
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <p className="text-muted-foreground text-lg mb-2">No posts yet</p>
                          <p className="text-muted-foreground text-sm">Be the first to share something with the community!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onUpdate={handlePostUpdate}
                          onDelete={handlePostDelete}
                          onSave={handleSavePost}
                          isSaved={savedPosts.some(p => p.id === post.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="following" className="space-y-6 mt-6">
                {followingLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : followingPosts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">No posts from followed users</p>
                      <p className="text-muted-foreground text-sm">Follow some users to see their posts here!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {followingPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onUpdate={handlePostUpdate}
                        onDelete={handlePostDelete}
                        onSave={handleSavePost}
                        isSaved={savedPosts.some(p => p.id === post.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="saved" className="space-y-6 mt-6">
                {savedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">No saved posts</p>
                      <p className="text-muted-foreground text-sm">Save posts to read them later!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {savedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onUpdate={handlePostUpdate}
                        onDelete={handlePostDelete}
                        onSave={handleSavePost}
                        isSaved={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - People to Follow */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  People to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={suggestedUser.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {suggestedUser.display_name?.[0] || suggestedUser.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-none truncate">
                          {suggestedUser.display_name || suggestedUser.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestedUser.followers_count} followers
                        </p>
                        {suggestedUser.is_company && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Company
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={suggestedUser.is_following ? "default" : "outline"}
                      onClick={() => handleFollowUser(suggestedUser.id)}
                      className="flex-shrink-0"
                    >
                      {suggestedUser.is_following ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  View all suggestions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;