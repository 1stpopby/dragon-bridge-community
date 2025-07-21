import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SuggestedUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  followers_count: number;
  is_company: boolean;
  is_following?: boolean;
}

interface AllSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followedUsers: Set<string>;
  onFollowUser: (userId: string) => void;
}

export const AllSuggestionsDialog = ({
  open,
  onOpenChange,
  followedUsers,
  onFollowUser
}: AllSuggestionsDialogProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<SuggestedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const USERS_PER_PAGE = 20;

  const fetchAllUsers = async (reset = false) => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const startIndex = reset ? 0 : (page - 1) * USERS_PER_PAGE;
      
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .range(startIndex, startIndex + USERS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,contact_email.ilike.%${searchQuery}%`);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      if (!users || users.length === 0) {
        setHasMore(false);
        if (reset) setAllUsers([]);
        return;
      }

      // Get follower counts for each user
      const usersWithFollowersPromises = users.map(async (user) => {
        const { count: followersCount } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        return {
          id: user.id,
          display_name: user.display_name || 'User',
          email: user.contact_email || user.display_name || 'User',
          avatar_url: user.avatar_url,
          is_company: user.account_type === 'company',
          followers_count: followersCount || 0,
          is_following: followedUsers.has(user.id)
        };
      });

      const usersWithFollowers = await Promise.all(usersWithFollowersPromises);
      
      if (reset) {
        setAllUsers(usersWithFollowers);
        setFilteredUsers(usersWithFollowers);
      } else {
        setAllUsers(prev => [...prev, ...usersWithFollowers]);
        setFilteredUsers(prev => [...prev, ...usersWithFollowers]);
      }

      setHasMore(users.length === USERS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast({
        title: "Error",
        description: "Failed to load user suggestions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setHasMore(true);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      setHasMore(true);
      fetchAllUsers(true);
    }
  }, [open, followedUsers]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setPage(1);
      setHasMore(true);
      const timeoutId = setTimeout(() => {
        fetchAllUsers(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (open) {
      fetchAllUsers(true);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (page > 1) {
      fetchAllUsers(false);
    }
  }, [page]);

  // Update follow status when followedUsers changes
  useEffect(() => {
    setAllUsers(prev => 
      prev.map(user => ({
        ...user,
        is_following: followedUsers.has(user.id)
      }))
    );
    setFilteredUsers(prev => 
      prev.map(user => ({
        ...user,
        is_following: followedUsers.has(user.id)
      }))
    );
  }, [followedUsers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            All Suggestions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex flex-col flex-1 min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {filteredUsers.length === 0 && !loading ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery.trim() ? "No users found" : "No suggestions available"}
                </p>
              </div>
            ) : (
              <>
                {filteredUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={suggestedUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {suggestedUser.display_name?.[0] || suggestedUser.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
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
                    <Button
                      size="sm"
                      variant={suggestedUser.is_following ? "default" : "outline"}
                      onClick={() => onFollowUser(suggestedUser.id)}
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
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};