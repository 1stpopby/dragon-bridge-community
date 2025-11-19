import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Shield,
  Building2,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Eye,
  ShieldCheck,
  Trash2
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
import { BanUserDialog } from "./BanUserDialog";

interface AdminUsersTableProps {
  onDataChange: () => void;
}

export const AdminUsersTable = ({ onDataChange }: AdminUsersTableProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch active bans
      const { data: bansData, error: bansError } = await supabase
        .from('user_bans')
        .select('user_id, is_active, expires_at')
        .eq('is_active', true);

      if (bansError) throw bansError;

      // Combine profiles with their roles and ban status
      const usersWithData = profilesData?.map(profile => {
        const userRoles = rolesData?.filter(role => role.user_id === profile.user_id) || [];
        const userBan = bansData?.find(ban => ban.user_id === profile.user_id);
        const isBanned = userBan && (
          !userBan.expires_at || new Date(userBan.expires_at) > new Date()
        );

        return {
          ...profile,
          user_roles: userRoles,
          is_banned: isBanned
        };
      }) || [];

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Failed to load users data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, role: 'admin' | 'moderator', hasRole: boolean) => {
    try {
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;

        toast({
          title: "Role removed",
          description: `User ${role} role has been removed successfully.`,
        });
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;

        toast({
          title: "Role assigned",
          description: `User has been assigned ${role} role successfully.`,
        });
      }

      fetchUsers();
      onDataChange();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error updating role",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    try {
      setActionLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session');
      }

      const { error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { userId }
      });

      if (error) throw error;

      toast({
        title: "Utilizator șters",
        description: `Contul utilizatorului ${displayName} a fost șters permanent.`,
      });

      await fetchUsers();
      onDataChange();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge utilizatorul",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerification = async (companyId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      
      const updateData = action === 'approve' 
        ? { 
            is_verified: true,
            verified_at: new Date().toISOString(),
            verification_notes: verificationNotes || null
          }
        : { 
            is_verified: false,
            verified_at: null,
            verification_notes: verificationNotes || null
          };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Update verification request status
      const { error: requestError } = await supabase
        .from('company_verification_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          admin_notes: verificationNotes
        })
        .eq('company_id', companyId);

      if (requestError) throw requestError;

      toast({
        title: action === 'approve' ? "Company verified" : "Verification rejected",
        description: `The company has been ${action === 'approve' ? 'verified' : 'rejected'} successfully.`,
      });

      setSelectedCompany(null);
      setVerificationNotes("");
      await fetchUsers();
      onDataChange();
    } catch (error) {
      console.error('Error handling verification:', error);
      toast({
        title: "Error",
        description: "Failed to update company verification status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.account_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserRoles = (userRoles: any[]) => {
    return userRoles?.map(ur => ur.role) || [];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Users Management ({filteredUsers.length})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No users match your search' : 'No users found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const roles = getUserRoles(user.user_roles);
                  const isAdmin = roles.includes('admin');
                  const isModerator = roles.includes('moderator');
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.account_type === 'company' && (
                            <Building2 className="h-4 w-4 text-blue-500" />
                          )}
                          {user.account_type === 'company' ? (
                            <button
                              onClick={() => setSelectedCompany(user)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                            >
                              {user.company_name || user.display_name}
                            </button>
                          ) : (
                            <span className="font-medium">{user.display_name}</span>
                          )}
                          {user.account_type === 'company' && user.is_verified && (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.contact_email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.account_type === 'company' ? 'default' : 'secondary'}>
                          {user.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {user.is_banned && (
                            <Badge variant="destructive" className="text-xs">
                              Banned
                            </Badge>
                          )}
                          {isAdmin && (
                            <Badge variant="destructive" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          {isModerator && (
                            <Badge variant="outline" className="text-xs">
                              Moderator
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {isAdmin ? (
                                  <UserX className="h-4 w-4 text-red-500" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isAdmin ? 'Remove Admin Role' : 'Grant Admin Role'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isAdmin 
                                    ? `Remove admin privileges from ${user.display_name}?`
                                    : `Grant admin privileges to ${user.display_name}? This will give them full access to the admin panel.`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => toggleUserRole(user.user_id, 'admin', isAdmin)}
                                  className={isAdmin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                                >
                                  {isAdmin ? 'Remove Admin' : 'Grant Admin'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Shield className={`h-4 w-4 ${isModerator ? 'text-blue-500' : 'text-gray-400'}`} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isModerator ? 'Remove Moderator Role' : 'Grant Moderator Role'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isModerator
                                    ? `Remove moderator privileges from ${user.display_name}?`
                                    : `Grant moderator privileges to ${user.display_name}?`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => toggleUserRole(user.user_id, 'moderator', isModerator)}
                                >
                                  {isModerator ? 'Remove Moderator' : 'Grant Moderator'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {!user.is_banned && (
                            <BanUserDialog
                              userId={user.user_id}
                              userName={user.display_name}
                              onBanComplete={fetchUsers}
                            />
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Această acțiune nu poate fi anulată. Contul utilizatorului <strong>{user.display_name}</strong> și toate datele asociate vor fi șterse permanent.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulează</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.user_id, user.display_name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Șterge utilizatorul
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Company Details Dialog */}
        {selectedCompany && (
          <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Company Details</DialogTitle>
                <DialogDescription>
                  Review company information and manage verification status.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Company Name</Label>
                    <p className="text-sm">{selectedCompany.company_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Contact Person</Label>
                    <p className="text-sm">{selectedCompany.display_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedCompany.contact_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedCompany.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <p className="text-sm">
                    {selectedCompany.company_website ? (
                      <a 
                        href={selectedCompany.company_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedCompany.company_website}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{selectedCompany.company_address || 'Not provided'}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Company Size</Label>
                  <p className="text-sm">{selectedCompany.company_size || 'Not provided'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Founded</Label>
                  <p className="text-sm">
                    {selectedCompany.company_founded 
                      ? new Date(selectedCompany.company_founded).getFullYear()
                      : 'Not provided'
                    }
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedCompany.company_description || 'Not provided'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Services</Label>
                  <p className="text-sm">
                    {selectedCompany.company_services?.length > 0 
                      ? selectedCompany.company_services.join(', ')
                      : 'Not provided'
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Verification Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedCompany.is_verified ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedCompany.verified_at && (
                    <div className="text-right">
                      <Label className="text-sm font-medium">Verified On</Label>
                      <p className="text-sm">{formatDate(selectedCompany.verified_at)}</p>
                    </div>
                  )}
                </div>

                {!selectedCompany.is_verified && (
                  <div>
                    <Label htmlFor="notes">Verification Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this verification..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                <div className="flex space-x-2">
                  {!selectedCompany.is_verified && (
                    <>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleVerification(selectedCompany.id, 'reject')}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => handleVerification(selectedCompany.id, 'approve')}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify Company
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};