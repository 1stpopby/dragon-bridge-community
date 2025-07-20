import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const isConfirmValid = confirmText.toLowerCase() === "delete my account";

  const handleDeleteAccount = async () => {
    if (!isConfirmValid) return;

    setLoading(true);
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
      window.location.href = '/';

    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <p className="font-medium">
              All of the following will be permanently deleted:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
              <li>Your profile and personal information</li>
              <li>All posts, comments, and forum activity</li>
              <li>Marketplace listings and inquiries</li>
              <li>Service requests and responses</li>
              <li>Event registrations and created events</li>
              <li>Group memberships and discussions</li>
              <li>Messages and notifications</li>
              <li>Company data (if applicable)</li>
            </ul>
            <div className="space-y-2 pt-4">
              <Label htmlFor="confirm-delete">
                Type <strong>"delete my account"</strong> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={!isConfirmValid || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};