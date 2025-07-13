import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ban } from "lucide-react";

interface BanUserDialogProps {
  userId: string;
  userName: string;
  onBanComplete: () => void;
}

export function BanUserDialog({ userId, userName, onBanComplete }: BanUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState<"temporary" | "permanent">("temporary");
  const [expiresIn, setExpiresIn] = useState("7"); // days
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBanUser = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the ban",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate expiry date for temporary bans
      let expiresAt = null;
      if (banType === "temporary") {
        const daysToAdd = parseInt(expiresIn);
        if (isNaN(daysToAdd) || daysToAdd <= 0) {
          toast({
            title: "Invalid expiry",
            description: "Please enter a valid number of days",
            variant: "destructive",
          });
          return;
        }
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);
      }

      // Get current admin user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Insert ban record
      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: userId,
          banned_by: user.id,
          reason: reason.trim(),
          ban_type: banType,
          expires_at: expiresAt?.toISOString(),
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "User banned successfully",
        description: `${userName} has been banned from the platform`,
      });

      // Reset form and close dialog
      setReason("");
      setBanType("temporary");
      setExpiresIn("7");
      setNotes("");
      setOpen(false);
      onBanComplete();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error banning user",
        description: "Failed to ban user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban className="h-4 w-4 mr-1" />
          Ban User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Ban <strong>{userName}</strong> from accessing the platform. 
            This action will prevent them from logging in and using the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for ban *</Label>
            <Input
              id="reason"
              placeholder="e.g., Inappropriate behavior, spam, harassment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="banType">Ban Type</Label>
            <Select value={banType} onValueChange={(value: "temporary" | "permanent") => setBanType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {banType === "temporary" && (
            <div className="grid gap-2">
              <Label htmlFor="expiresIn">Ban Duration (days)</Label>
              <Input
                id="expiresIn"
                type="number"
                min="1"
                placeholder="7"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about this ban..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleBanUser}
            disabled={loading || !reason.trim()}
          >
            <Ban className="h-4 w-4 mr-1" />
            {loading ? "Banning..." : "Ban User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}