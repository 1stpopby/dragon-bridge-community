import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AdminBotTemplatesTableProps {
  onDataChange: () => void;
}

export const AdminBotTemplatesTable = ({ onDataChange }: AdminBotTemplatesTableProps) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content_type: 'post' as 'post' | 'forum_topic' | 'forum_reply',
    template_text: '',
    category: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_content_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut încărca șabloanele",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('bot_content_templates')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Succes",
          description: "Șablon actualizat",
        });
      } else {
        const { error } = await supabase
          .from('bot_content_templates')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Succes",
          description: "Șablon creat",
        });
      }

      setOpen(false);
      resetForm();
      fetchTemplates();
      onDataChange();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut salva șablonul",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bot_content_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Șablon șters",
      });
      fetchTemplates();
      onDataChange();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut șterge șablonul",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bot_content_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      fetchTemplates();
      onDataChange();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut actualiza statusul",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      content_type: 'post',
      template_text: '',
      category: '',
      is_active: true
    });
    setEditingId(null);
  };

  const startEdit = (template: any) => {
    setFormData({
      content_type: template.content_type,
      template_text: template.template_text,
      category: template.category || '',
      is_active: template.is_active
    });
    setEditingId(template.id);
    setOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      post: 'Postare Feed',
      forum_topic: 'Subiect Forum',
      forum_reply: 'Răspuns Forum'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Șabloane de Conținut</CardTitle>
              <CardDescription>
                Gestionează șabloanele pentru postări, subiecte forum și răspunsuri generate de roboți
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={(open) => { setOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Șablon Nou
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editează Șablon' : 'Șablon Nou'}</DialogTitle>
                    <DialogDescription>
                      Folosește [city], [topic], [service], [product], [activity] ca variabile
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tip Conținut</Label>
                      <Select
                        value={formData.content_type}
                        onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post">Postare Feed</SelectItem>
                          <SelectItem value="forum_topic">Subiect Forum</SelectItem>
                          <SelectItem value="forum_reply">Răspuns Forum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Șablon</Label>
                      <Textarea
                        value={formData.template_text}
                        onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
                        placeholder="Bună! Am ajuns recent în [city]. Cunoaște cineva un [service] bun în zonă?"
                        rows={6}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Pentru subiecte forum, separă titlul de conținut cu | (exemplu: "Titlu|Conținut subiect")
                      </p>
                    </div>

                    {formData.content_type === 'forum_topic' && (
                      <div className="space-y-2">
                        <Label>Categorie Forum</Label>
                        <Input
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Discuții Generale"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="active">Activ</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Anulează
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Actualizează' : 'Creează'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Niciun șablon creat încă
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Utilizări</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(template.content_type)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate">{template.template_text}</div>
                    </TableCell>
                    <TableCell>{template.category || '-'}</TableCell>
                    <TableCell>{template.usage_count || 0}</TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => toggleActive(template.id, template.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ștergi acest șablon?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Această acțiune nu poate fi anulată.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                              Șterge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};