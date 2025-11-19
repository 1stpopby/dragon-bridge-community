import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ReportDialogProps {
  contentType: "post" | "forum_post" | "group_discussion" | "forum_reply" | "marketplace_item";
  contentId: string;
  trigger?: React.ReactNode;
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

export const ReportDialog = ({ contentType, contentId, trigger }: ReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleSubmit = async () => {
    if (!profile) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat pentru a raporta conținut",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Eroare",
        description: "Te rugăm să selectezi un motiv",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("reports").insert({
        content_type: contentType,
        content_id: contentId,
        reporter_id: profile.id,
        reporter_name: profile.display_name,
        reason,
        description: description || null,
      });

      if (error) throw error;

      toast({
        title: "Raportare trimisă",
        description: "Vă mulțumim pentru raportare. Echipa noastră va examina conținutul.",
      });

      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut trimite raportarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raportează conținutul</DialogTitle>
          <DialogDescription>
            Raportează acest conținut dacă încalcă regulile comunității. Echipa noastră va examina raportarea.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivul raportării</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selectează un motiv" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detalii suplimentare (opțional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Oferă mai multe detalii despre această raportare..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Anulează
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Se trimite..." : "Trimite raportarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
