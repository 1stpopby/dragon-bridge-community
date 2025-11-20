import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Play, Pause, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AdminBotsTableProps {
  onDataChange: () => void;
}

export const AdminBotsTable = ({ onDataChange }: AdminBotsTableProps) => {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [systemEnabled, setSystemEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBots();
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'bot_system_enabled')
      .single();

    if (data) {
      setSystemEnabled(data.setting_value as boolean);
    }
  };

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_bot', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut încărca lista de roboți",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSystemStatus = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: enabled })
        .eq('setting_key', 'bot_system_enabled');

      if (error) throw error;

      setSystemEnabled(enabled);
      toast({
        title: "Succes",
        description: `Sistem roboți ${enabled ? 'activat' : 'dezactivat'}`,
      });
      onDataChange();
    } catch (error) {
      console.error('Error toggling system:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut actualiza statusul sistemului",
        variant: "destructive",
      });
    }
  };

  const triggerGeneration = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('bot-content-generator');

      if (error) throw error;

      // Check if we got a message instead of results (e.g., outside active hours)
      if (data?.message) {
        toast({
          title: "Informare",
          description: data.message,
        });
        return;
      }

      // Check if we got results
      if (data?.results) {
        toast({
          title: "Succes",
          description: `Roboții au creat conținut: ${data.results.posts_created} postări, ${data.results.forum_topics_created} subiecte forum, ${data.results.replies_created} răspunsuri`,
        });
        onDataChange();
      } else {
        throw new Error('Răspuns invalid de la server');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut genera conținut",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const deleteBot = async (botId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', botId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Robot șters",
      });
      fetchBots();
      onDataChange();
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut șterge robotul",
        variant: "destructive",
      });
    }
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
              <CardTitle>Control Sistem Roboți</CardTitle>
              <CardDescription>
                Activează/dezactivează sistemul de roboți și generează conținut manual
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bot-system"
                  checked={systemEnabled}
                  onCheckedChange={toggleSystemStatus}
                />
                <Label htmlFor="bot-system">
                  {systemEnabled ? 'Activ' : 'Inactiv'}
                </Label>
              </div>
              <Button
                onClick={triggerGeneration}
                disabled={generating || !systemEnabled}
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generare...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Generează Acum
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Roboți Activi ({bots.length})</CardTitle>
            <Button onClick={fetchBots} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Gestionează conturile de roboți pentru generarea automată de conținut
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Niciun robot creat încă. Apasă "Generează Acum" pentru a crea roboți și conținut.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead>Creat</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {bot.display_name}
                        <Badge variant="secondary" className="text-xs">
                          BOT
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{bot.location || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{bot.bio || '-'}</TableCell>
                    <TableCell>{new Date(bot.created_at).toLocaleDateString('ro-RO')}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ștergi acest robot?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Această acțiune va șterge permanent robotul și toate activitățile asociate.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBot(bot.id)}>
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