import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";

interface AdminPostsGeneratorProps {
  onDataChange: () => void;
}

export const AdminPostsGenerator = ({ onDataChange }: AdminPostsGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [contentType, setContentType] = useState<"feed" | "forum">("feed");
  const [customPrompt, setCustomPrompt] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('bot-content-generator', {
        body: { 
          contentType,
          customPrompt: customPrompt.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.message) {
        toast({
          title: "Informare",
          description: data.message,
        });
        return;
      }

      if (data?.results) {
        const { posts_created, forum_topics_created, forum_replies_created, comments_created } = data.results;
        
        let description = "Conținut generat cu succes: ";
        const parts = [];
        if (posts_created > 0) parts.push(`${posts_created} postări feed`);
        if (forum_topics_created > 0) parts.push(`${forum_topics_created} subiecte forum`);
        if (forum_replies_created > 0) parts.push(`${forum_replies_created} răspunsuri forum`);
        if (comments_created > 0) parts.push(`${comments_created} comentarii`);
        
        description += parts.join(", ");

        toast({
          title: "Succes",
          description,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generator Postări AI</h2>
        <p className="text-muted-foreground">
          Generează postări automat folosind inteligență artificială
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generare Conținut</CardTitle>
          <CardDescription>
            Configurează și generează postări noi pentru feed sau forum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="content-type">Tip Conținut</Label>
            <Select value={contentType} onValueChange={(value: "feed" | "forum") => setContentType(value)}>
              <SelectTrigger id="content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feed">Postări Feed</SelectItem>
                <SelectItem value="forum">Subiecte Forum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Prompt Personalizat (Opțional)</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Ex: Generează o postare despre comunitatea românească în UK și tradițiile de Crăciun..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Lasă gol pentru a genera conținut automat bazat pe teme predefinite
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gap-2"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generare în curs...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generează Conținut
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Cum Funcționează?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <p>Alege tipul de conținut pe care vrei să-l generezi (feed sau forum)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <p>Opțional: Adaugă un prompt personalizat pentru a direcționa conținutul</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              3
            </div>
            <p>Apasă "Generează Conținut" și AI-ul va crea postări naturale în limba română</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              4
            </div>
            <p>Postările vor fi publicate automat cu conturi bot simulate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};