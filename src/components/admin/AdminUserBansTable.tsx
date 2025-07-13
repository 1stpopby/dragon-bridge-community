import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Ban, Search, Shield, ShieldOff } from "lucide-react";

interface UserBan {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string;
  ban_type: string;
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  user_profile?: {
    display_name: string;
    contact_email: string;
  };
  banned_by_profile?: {
    display_name: string;
  };
}

interface AdminUserBansTableProps {
  onDataChange: () => void;
}

export function AdminUserBansTable({ onDataChange }: AdminUserBansTableProps) {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchUserBans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_bans')
        .select(`
          id,
          user_id,
          banned_by,
          reason,
          ban_type,
          banned_at,
          expires_at,
          is_active,
          notes,
          created_at,
          updated_at
        `)
        .order('banned_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set([
        ...data?.map(ban => ban.user_id) || [],
        ...data?.map(ban => ban.banned_by) || []
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, contact_email')
        .in('user_id', userIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const bansWithProfiles = data?.map(ban => ({
        ...ban,
        user_profile: profileMap[ban.user_id],
        banned_by_profile: profileMap[ban.banned_by]
      })) || [];

      setBans(bansWithProfiles);
    } catch (error) {
      console.error('Error fetching user bans:', error);
      toast({
        title: "Error loading user bans",
        description: "Failed to load user bans data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const liftBan = async (banId: string) => {
    try {
      const { error } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('id', banId);

      if (error) throw error;

      toast({
        title: "Ban lifted successfully",
        description: "User ban has been lifted",
      });

      fetchUserBans();
      onDataChange();
    } catch (error) {
      console.error('Error lifting ban:', error);
      toast({
        title: "Error lifting ban",
        description: "Failed to lift user ban",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserBans();
  }, []);

  const filteredBans = bans.filter(ban =>
    ban.user_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ban.user_profile?.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ban.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBanStatus = (ban: UserBan) => {
    if (!ban.is_active) return 'lifted';
    if (ban.expires_at && new Date(ban.expires_at) <= new Date()) return 'expired';
    return 'active';
  };

  const getBanStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'expired': return 'secondary';
      case 'lifted': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Bans</h2>
          <p className="text-muted-foreground">
            Manage banned users and view ban history
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Ban className="h-3 w-3" />
          <span>{filteredBans.filter(ban => getBanStatus(ban) === 'active').length} Active Bans</span>
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bans by user name, email, or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Banned At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Banned By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No user bans found
                </TableCell>
              </TableRow>
            ) : (
              filteredBans.map((ban) => {
                const status = getBanStatus(ban);
                return (
                  <TableRow key={ban.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ban.user_profile?.display_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {ban.user_profile?.contact_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{ban.reason}</div>
                        {ban.notes && (
                          <div className="text-sm text-muted-foreground truncate">
                            {ban.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ban.ban_type === 'permanent' ? 'destructive' : 'secondary'}>
                        {ban.ban_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBanStatusVariant(status)}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(ban.banned_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ban.expires_at ? formatDate(ban.expires_at) : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ban.banned_by_profile?.display_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {status === 'active' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Lift Ban
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Lift User Ban</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to lift the ban for{" "}
                                <strong>{ban.user_profile?.display_name}</strong>? 
                                This will allow them to access the application again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => liftBan(ban.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Lift Ban
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}