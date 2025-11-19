import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Eye, Trash2, CheckCircle, XCircle } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

interface AdminReportsTableProps {
  onDataChange: () => void;
}

const REPORT_REASONS = {
  spam: "Spam sau publicitate",
  harassment: "Hărțuire sau intimidare",
  hate_speech: "Incitare la ură",
  violence: "Violență sau amenințări",
  inappropriate: "Conținut inadecvat",
  misinformation: "Dezinformare",
  other: "Altele"
};

const CONTENT_TYPE_LABELS = {
  post: "Postare Feed",
  forum_post: "Postare Forum",
  group_discussion: "Discuție Grup",
  forum_reply: "Răspuns Forum",
  marketplace_item: "Anunț Marketplace"
};

export const AdminReportsTable = ({ onDataChange }: AdminReportsTableProps) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca raportările",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const handleDismissReport = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("reports")
        .update({
          status: "dismissed",
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedReport.id);

      if (error) throw error;

      toast({
        title: "Raportare respinsă",
        description: "Raportarea a fost marcată ca respinsă",
      });

      setViewDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes("");
      await fetchReports();
      onDataChange();
    } catch (error) {
      console.error("Error dismissing report:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut respinge raportarea",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);

      // Delete the reported content
      const tableName = selectedReport.content_type === "group_discussion" 
        ? "group_discussions" 
        : selectedReport.content_type === "forum_reply"
        ? "forum_replies"
        : selectedReport.content_type === "marketplace_item"
        ? "marketplace_items"
        : selectedReport.content_type === "forum_post"
        ? "forum_posts"
        : "posts";

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", selectedReport.content_id);

      if (deleteError) throw deleteError;

      // Update report status
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: "action_taken",
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || "Conținut șters",
        })
        .eq("id", selectedReport.id);

      if (updateError) throw updateError;

      toast({
        title: "Conținut șters",
        description: "Conținutul raportat a fost șters cu succes",
      });

      setDeleteDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes("");
      await fetchReports();
      onDataChange();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge conținutul",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ro-RO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "default", label: "În așteptare" },
      reviewed: { variant: "secondary", label: "Examinat" },
      dismissed: { variant: "outline", label: "Respins" },
      action_taken: { variant: "destructive", label: "Acțiune luată" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Raportări
            </CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrează după status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="pending">În așteptare</SelectItem>
                <SelectItem value="reviewed">Examinate</SelectItem>
                <SelectItem value="dismissed">Respinse</SelectItem>
                <SelectItem value="action_taken">Acțiune luată</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip conținut</TableHead>
                  <TableHead>Raportat de</TableHead>
                  <TableHead>Motiv</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Se încarcă...
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nu există raportări
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {CONTENT_TYPE_LABELS[report.content_type as keyof typeof CONTENT_TYPE_LABELS]}
                      </TableCell>
                      <TableCell>{report.reporter_name}</TableCell>
                      <TableCell>
                        {REPORT_REASONS[report.reason as keyof typeof REPORT_REASONS]}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.admin_notes || "");
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalii raportare</DialogTitle>
            <DialogDescription>
              Revizuiește raportarea și alege o acțiune
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Tip conținut</Label>
                  <p className="text-sm text-muted-foreground">
                    {CONTENT_TYPE_LABELS[selectedReport.content_type as keyof typeof CONTENT_TYPE_LABELS]}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Raportat de</Label>
                  <p className="text-sm text-muted-foreground">{selectedReport.reporter_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedReport.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Motiv</Label>
                <p className="text-sm text-muted-foreground">
                  {REPORT_REASONS[selectedReport.reason as keyof typeof REPORT_REASONS]}
                </p>
              </div>

              {selectedReport.description && (
                <div>
                  <Label className="text-sm font-medium">Descriere</Label>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <Label htmlFor="admin-notes">Note admin</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adaugă note despre această raportare..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDismissReport}
              disabled={actionLoading || selectedReport?.status !== "pending"}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Respinge raportarea
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionLoading || selectedReport?.status !== "pending"}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Șterge conținutul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Conținutul raportat va fi șters permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge conținutul
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
