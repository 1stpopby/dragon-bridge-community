import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Trash2,
  Search, 
  Shield,
  AlertCircle,
  UserCheck,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface AdminUserRolesTableProps {
  onDataChange: () => void;
}

export const AdminUserRolesTable = ({ onDataChange }: AdminUserRolesTableProps) => {
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!inner(
            display_name,
            contact_email,
            account_type
          )
        `)
        .order('granted_at', { ascending: false });

      if (rolesError) throw rolesError;

      setUserRoles(rolesData || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error loading user roles",
        description: "Failed to load user roles data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Role revoked",
        description: "The user role has been successfully revoked.",
      });

      fetchUserRoles();
      onDataChange();
    } catch (error) {
      console.error('Error revoking role:', error);
      toast({
        title: "Error revoking role",
        description: "Failed to revoke the user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const filteredRoles = userRoles.filter(userRole =>
    userRole.profiles?.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.profiles?.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-red-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserCheck className="h-4 w-4 text-green-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Roles Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading user roles...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Roles Management ({filteredRoles.length})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted At</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No roles match your search' : 'No user roles found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(userRole.role)}
                        <span className="font-medium">{userRole.profiles?.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {userRole.profiles?.contact_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {userRole.profiles?.account_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(userRole.role)}>
                        {userRole.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(userRole.granted_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {userRole.granted_by ? 'Admin' : 'System'}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                              Revoke Role
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke the {userRole.role} role from {userRole.profiles?.display_name}? They will lose all privileges associated with this role.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeRole(userRole.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Role
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};