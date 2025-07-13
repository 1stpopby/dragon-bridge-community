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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface Company {
  id: string;
  user_id: string;
  display_name: string;
  company_name: string;
  contact_email: string;
  company_description: string;
  company_website: string;
  company_phone: string;
  company_address: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

interface AdminCompanyVerificationTableProps {
  onDataChange: () => void;
}

export function AdminCompanyVerificationTable({ onDataChange }: AdminCompanyVerificationTableProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'company')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error loading companies",
        description: "Failed to load companies data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (companyId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: any = {
        verification_notes: verificationNotes.trim() || null,
      };

      if (action === 'approve') {
        updateData.is_verified = true;
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user.id;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: `Company ${action === 'approve' ? 'verified' : 'rejected'}`,
        description: `Company has been ${action === 'approve' ? 'verified successfully' : 'rejected'}`,
      });

      setSelectedCompany(null);
      setVerificationNotes("");
      fetchCompanies();
      onDataChange();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error updating verification",
        description: "Failed to update company verification status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusBadge = (company: Company) => {
    if (company.is_verified) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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

  const pendingCount = filteredCompanies.filter(c => !c.is_verified).length;
  const verifiedCount = filteredCompanies.filter(c => c.is_verified).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Company Verification</h2>
          <p className="text-muted-foreground">
            Review and verify company registrations
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{pendingCount} Pending</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>{verifiedCount} Verified</span>
          </Badge>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">{company.company_name || company.display_name}</div>
                        <div className="text-sm text-muted-foreground">{company.display_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{company.contact_email}</div>
                      {company.company_phone && (
                        <div className="text-sm text-muted-foreground">{company.company_phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {company.company_website ? (
                      <a 
                        href={company.company_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {company.company_website}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(company)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(company.created_at)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCompany(company)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Company Verification Review</DialogTitle>
                          <DialogDescription>
                            Review the company details and verify or reject the registration.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedCompany && (
                          <div className="grid gap-4 py-4">
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
                                <p className="text-sm">{selectedCompany.company_phone || 'Not provided'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Website</Label>
                              <p className="text-sm">{selectedCompany.company_website || 'Not provided'}</p>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Address</Label>
                              <p className="text-sm">{selectedCompany.company_address || 'Not provided'}</p>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Description</Label>
                              <p className="text-sm">{selectedCompany.company_description || 'Not provided'}</p>
                            </div>

                            <div>
                              <Label htmlFor="notes">Admin Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add notes about this verification..."
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                        )}

                        <DialogFooter className="flex justify-between">
                          <div className="flex space-x-2">
                            {!selectedCompany?.is_verified && (
                              <>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => selectedCompany && handleVerification(selectedCompany.id, 'reject')}
                                  disabled={actionLoading}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button 
                                  onClick={() => selectedCompany && handleVerification(selectedCompany.id, 'approve')}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                              </>
                            )}
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}