import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export const AdminContactMessagesTable = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-contact-messages", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast({ title: "Status actualizat cu succes" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast({ title: "Mesaj șters cu succes" });
    },
  });

  const filteredMessages = messages?.filter((message) =>
    message.name.toLowerCase().includes(search.toLowerCase()) ||
    message.email.toLowerCase().includes(search.toLowerCase()) ||
    message.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      unread: "default",
      read: "secondary",
      responded: "outline",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status === "unread" ? "Necitit" : status === "read" ? "Citit" : "Răspuns trimis"}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Se încarcă...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Caută după nume, email sau subiect..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="unread">Necitite</SelectItem>
            <SelectItem value="read">Citite</SelectItem>
            <SelectItem value="responded">Răspuns trimis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nume</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subiect</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages?.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="font-medium">{message.name}</TableCell>
                <TableCell>{message.email}</TableCell>
                <TableCell>{message.subject}</TableCell>
                <TableCell>{getStatusBadge(message.status)}</TableCell>
                <TableCell>
                  {format(new Date(message.created_at), "dd MMM yyyy, HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (message.status === "unread") {
                              updateStatusMutation.mutate({
                                id: message.id,
                                status: "read",
                              });
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Mesaj de contact</DialogTitle>
                          <DialogDescription>
                            De la {message.name} ({message.email})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Subiect:</h4>
                            <p>{message.subject}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Mesaj:</h4>
                            <p className="whitespace-pre-wrap">{message.message}</p>
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={message.status}
                              onValueChange={(status) =>
                                updateStatusMutation.mutate({ id: message.id, status })
                              }
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unread">Necitit</SelectItem>
                                <SelectItem value="read">Citit</SelectItem>
                                <SelectItem value="responded">Răspuns trimis</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(`mailto:${message.email}?subject=Re: ${message.subject}`)
                              }
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Răspunde prin email
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Ești sigur că vrei să ștergi acest mesaj?")) {
                          deleteMutation.mutate(message.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
