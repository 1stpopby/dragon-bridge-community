import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Users, Trash2, UserPlus, UserMinus, Lock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GroupDialog } from "./GroupDialog";
import { Link } from "react-router-dom";

interface GroupCardProps {
  group: any;
  onGroupChanged: () => void;
  showActions?: boolean;
}

export function GroupCard({ group, onGroupChanged, showActions = true }: GroupCardProps) {
  const [loading, setLoading] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('community_groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      toast({
        title: "Group deleted successfully",
        description: "The group has been removed from the community.",
      });

      onGroupChanged();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error deleting group",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('group_memberships')
        .insert([{
          group_id: group.id,
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
          description: `Welcome to ${group.name}!`,
        });
        setJoinDialogOpen(false);
        setMemberName("");
        onGroupChanged();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining group",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVariantForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'professional': return 'default';
      case 'family': return 'secondary';
      case 'students': return 'outline';
      case 'cultural': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={getVariantForCategory(group.category)}>
            {group.category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            {group.member_count || 0}
          </div>
        </div>
        <CardTitle className="text-lg">{group.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          {group.location}
        </div>
      </CardHeader>
      <CardContent>
        {group.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {group.description}
          </p>
        )}
        
        {showActions ? (
          <div className="flex gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                {!user || !profile ? (
                  <Button asChild className="flex-1">
                    <Link to="/auth" className="flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" />
                      Sign in to Join
                    </Link>
                  </Button>
                ) : (
                  <Button className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Group
                  </Button>
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join {group.name}</DialogTitle>
                  <DialogDescription>
                    Enter your name to join this community group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memberName">Your Name</Label>
                    <Input
                      id="memberName"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Enter your full name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleJoinGroup();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleJoinGroup} disabled={loading}>
                      {loading ? 'Joining...' : 'Join Group'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <GroupDialog
              group={group}
              onGroupSaved={onGroupChanged}
              mode="edit"
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{group.name}"? This action cannot be undone and will remove all members.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Group
          </Button>
        )}
        
        <div className="flex gap-2 mt-3">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/group/${group.id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {user ? 'View Forum' : 'Private Forum'}
            </Link>
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Organized by {group.organizer_name}
        </div>
      </CardContent>
    </Card>
  );
}