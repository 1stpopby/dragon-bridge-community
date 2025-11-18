import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, UserPlus, Users, Flame, Eye, Bookmark, Heart, UserCheck, Hash } from "lucide-react";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { useNavigate } from "react-router-dom";
import { AllSuggestionsDialog } from "@/components/AllSuggestionsDialog";

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
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#[a-zA-Z0-9_]+/g) || [];
    return hashtags.map(tag => tag.toLowerCase());
  };

  const fetchTrendingTopics = async () => {
    try {
      // Get all posts to extract hashtags
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('content')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (error) throw error;

      // Extract and count hashtags
      const hashtagCount: Record<string, number> = {};
      postsData?.forEach(post => {
        const hashtags = extractHashtags(post.content);
        hashtags.forEach(tag => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
      });

      // Convert to trending topics format and sort by count
      const trending = Object.entries(hashtagCount)
        .map(([tag, count]) => ({
          hashtag: tag,
          count,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down' as 'up' | 'down' | 'stable'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setTrendingTopics(trending);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      // Fallback to empty array
      setTrendingTopics([]);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('fetchPosts called, user:', user?.id);
      
      // Fetch posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Posts query result:', { postsData, postsError });

      if (postsError) {
        console.error('Error in posts query:', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, display_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error in profiles query:', profilesError);
        // Continue without profile data
      }

      // Create a map of user_id to profile data
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      );

      if (user) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) {
          console.error('Error in likes query:', likesError);
          throw likesError;
        }

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        const postsWithLikeStatus = postsData.map(post => {
          const profile = profilesMap.get(post.user_id);
          return {
            ...post,
            // Use the latest avatar from profiles table if available
            author_avatar: profile?.avatar_url || post.author_avatar,
            author_name: profile?.display_name || post.author_name,
            user_liked: likedPostIds.has(post.id)
          };
        });

        console.log('Setting posts with like status:', postsWithLikeStatus.length);
        setPosts(postsWithLikeStatus);
      } else {
        const postsWithLatestAvatars = postsData.map(post => {
          const profile = profilesMap.get(post.user_id);
          return {
            ...post,
            // Use the latest avatar from profiles table if available
            author_avatar: profile?.avatar_url || post.author_avatar,
            author_name: profile?.display_name || post.author_name,
          };
        });
        console.log('Setting posts without user:', postsWithLatestAvatars.length);
        setPosts(postsWithLatestAvatars);
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

      // Get real follower counts for each user
      const usersWithFollowersPromises = users?.map(async (user) => {
        const { count: followersCount } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        return {
          id: user.id,
          display_name: user.display_name,
          email: user.display_name || 'User',
          avatar_url: user.avatar_url,
          is_company: user.account_type === 'company',
          followers_count: followersCount || 0,
          is_following: followedUsers.has(user.id)
        };
      }) || [];

      const usersWithFollowers = await Promise.all(usersWithFollowersPromises);

      setSuggestedUsers(usersWithFollowers);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const fetchFollowingPosts = async () => {
    if (!user || !profile) return;
    
    console.log('fetchFollowingPosts called, followedUsers:', followedUsers.size);
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

      // Fetch posts from followed users
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setFollowingPosts([]);
        return;
      }

      // Get profiles for these posts
      const postUserIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError2 } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, display_name')
        .in('user_id', postUserIds);

      if (profilesError2) {
        console.error('Error fetching profiles:', profilesError2);
      }

      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      );

      if (user) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) throw likesError;

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        const postsWithLikeStatus = postsData.map(post => {
          const profile = profilesMap.get(post.user_id);
          return {
            ...post,
            author_avatar: profile?.avatar_url || post.author_avatar,
            author_name: profile?.display_name || post.author_name,
            user_liked: likedPostIds.has(post.id)
          };
        });

        setFollowingPosts(postsWithLikeStatus);
      } else {
        const postsWithLatestAvatars = postsData.map(post => {
          const profile = profilesMap.get(post.user_id);
          return {
            ...post,
            author_avatar: profile?.avatar_url || post.author_avatar,
            author_name: profile?.display_name || post.author_name,
          };
        });
        setFollowingPosts(postsWithLatestAvatars);
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
    if (!user) return;
    
    console.log('fetchSavedPosts called, profile.id:', profile?.id);
    setSavedLoading(true);
    try {
      const { data: savedPostsData, error } = await supabase
        .from('saved_posts')
        .select(`
          post_id,
          posts (*)
        `)
        .eq('user_id', profile?.id); // Use profile.id instead of user.id

      if (error) throw error;

      const posts = savedPostsData?.map(sp => sp.posts).filter(Boolean) || [];
      
      if (posts.length > 0) {
        // Enhance saved posts with latest profile info
        const postsWithUserIds = posts.map(p => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, display_name')
          .in('user_id', postsWithUserIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) throw likesError;

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        const postsWithLikeStatus = posts.map(post => {
          const profile = profilesMap.get(post.user_id);
          return {
            ...post,
            // Use the latest avatar from profiles table if available
            author_avatar: profile?.avatar_url || post.author_avatar,
            author_name: profile?.display_name || post.author_name,
            user_liked: likedPostIds.has(post.id)
          };
        });

        setSavedPosts(postsWithLikeStatus);
      } else {
        setSavedPosts([]);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      toast({
        title: "Eroare la încărcarea postărilor salvate",
        description: "Nu s-au putut încărca postările salvate.",
        variant: "destructive",
      });
    } finally {
      setSavedLoading(false);
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
          .eq('user_id', profile.id) // Use profile.id instead of user.id
          .eq('post_id', post.id);

        if (error) {
          console.error('Error unsaving post:', error.message || error);
          throw error;
        }

        setSavedPosts(prev => prev.filter(p => p.id !== post.id));
        toast({
          title: "Postare desalvată",
          description: "Postarea a fost eliminată din postările salvate.",
        });
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: profile.id, // Use profile.id instead of user.id
            post_id: post.id
          });

        if (error) {
          console.error('Error saving post:', error.message || error);
          throw error;
        }

        setSavedPosts(prev => [...prev, post]);
        toast({
          title: "Postare salvată",
          description: "Postare salvată pentru mai târziu!",
        });
      }
    } catch (error: any) {
      console.error('Error saving/unsaving post:', error.message || error);
      toast({
        title: "Eroare",
        description: `Actualizare eșuată: ${error.message || 'Vă rugăm să încercați din nou.'}`,
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
          title: "Utilizator ne-mai-urmat",
          description: "Nu mai urmăriți acest utilizator.",
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
          title: "Utilizator urmat",
          description: "Acum urmăriți acest utilizator!",
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
        title: "Eroare",
        description: "Actualizare stare urmărire eșuată. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    // Refresh trending topics when new post is created
    fetchTrendingTopics();
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    setFollowingPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    setSavedPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setFollowingPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setSavedPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
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
  }, [activeTab, followedUsers]);

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
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Trending Topics */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Trending Hashtags
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Hash className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Încă nu există hashtag-uri</p>
                    <p className="text-xs text-muted-foreground mt-1">Folosește #hashtag-uri în postările tale!</p>
                  </div>
                ) : (
                  trendingTopics.map((topic, index) => (
                    <div key={topic.hashtag} className="group">
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary/20 transition-colors">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-primary group-hover:text-primary/80 transition-colors">{topic.hashtag}</p>
                            <p className="text-xs text-muted-foreground">{topic.count} postări</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-background shadow-sm">
                            {getTrendIcon(topic.trend)}
                          </div>
                          <span className={`text-xs font-semibold ${getTrendColor(topic.trend)}`}>
                            {topic.trend === 'up' ? '+18%' : topic.trend === 'down' ? '-14%' : '8%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {trendingTopics.length > 0 && (
                  <div className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200">
                      <span className="mr-2">Vezi toate tendințele</span>
                      <div className="p-1 rounded-md bg-primary/10">
                        <TrendingUp className="h-3 w-3 text-primary" />
                      </div>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
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
                      posts.map((post, index) => (
                        <div key={`post-${post.id}`}>
                          {/* Insert ad after 1st post, then every 4 posts */}
                          {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                            <div className="mb-6">
                              <AdvertisementBanner 
                                location="feed" 
                                variant="card" 
                                maxAds={1}
                              />
                            </div>
                          )}
                          <PostCard
                            post={post}
                            onUpdate={handlePostUpdate}
                            onDelete={handlePostDelete}
                            onSave={handleSavePost}
                            isSaved={savedPosts.some(p => p.id === post.id)}
                            onFollow={handleFollowUser}
                          />
                        </div>
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
                    {followingPosts.map((post, index) => (
                      <div key={`following-${post.id}`}>
                        {/* Insert ad after 1st post, then every 4 posts */}
                        {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                          <div className="mb-6">
                            <AdvertisementBanner 
                              location="feed" 
                              variant="card" 
                              maxAds={1}
                            />
                          </div>
                        )}
                        <PostCard
                          post={post}
                          onUpdate={handlePostUpdate}
                          onDelete={handlePostDelete}
                          onSave={handleSavePost}
                          isSaved={savedPosts.some(p => p.id === post.id)}
                          onFollow={handleFollowUser}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="saved" className="space-y-6 mt-6">
                {savedLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : savedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">No saved posts</p>
                      <p className="text-muted-foreground text-sm">Save posts to read them later!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {savedPosts.map((post, index) => (
                      <div key={`saved-${post.id}`}>
                        {/* Insert ad after 1st post, then every 4 posts */}
                        {(index === 1 || (index > 1 && (index - 1) % 4 === 0)) && (
                          <div className="mb-6">
                            <AdvertisementBanner 
                              location="feed" 
                              variant="card" 
                              maxAds={1}
                            />
                          </div>
                        )}
                        <PostCard
                          post={post}
                          onUpdate={handlePostUpdate}
                          onDelete={handlePostDelete}
                          onSave={handleSavePost}
                          isSaved={true}
                          onFollow={handleFollowUser}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - People to Follow */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    People to Follow
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No suggestions yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Check back later for new people to follow!</p>
                  </div>
                ) : (
                  suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="group">
                      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 border border-transparent hover:border-border/50">
                        <div 
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => navigate(`/user/${suggestedUser.id}`)}
                        >
                          <Avatar className="h-12 w-12 ring-2 ring-background shadow-md group-hover:ring-primary/20 transition-all">
                            <AvatarImage src={suggestedUser.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-sm font-semibold">
                              {suggestedUser.display_name?.[0] || suggestedUser.email[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm leading-none truncate text-foreground group-hover:text-primary transition-colors">
                                {suggestedUser.display_name || suggestedUser.email.split('@')[0]}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {suggestedUser.followers_count} followers
                                </p>
                                {suggestedUser.is_company && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                                    <span className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                      Company
                                    </span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={suggestedUser.is_following ? "secondary" : "default"}
                            onClick={() => handleFollowUser(suggestedUser.id)}
                            className={`w-full mt-3 gap-2 transition-all duration-200 ${
                              suggestedUser.is_following 
                                ? 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground' 
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                            }`}
                          >
                            {suggestedUser.is_following ? (
                              <>
                                <UserCheck className="h-4 w-4" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4" />
                                Follow
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {suggestedUsers.length > 0 && (
                  <div className="pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200"
                      onClick={() => setShowAllSuggestions(true)}
                    >
                      <span className="mr-2">View all suggestions</span>
                      <div className="p-1 rounded-md bg-primary/10">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <MobileNavigation />
      
      {/* All Suggestions Dialog */}
      <AllSuggestionsDialog
        open={showAllSuggestions}
        onOpenChange={setShowAllSuggestions}
        followedUsers={followedUsers}
        onFollowUser={handleFollowUser}
      />
    </div>
  );
};

export default Feed;