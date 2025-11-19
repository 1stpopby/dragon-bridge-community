import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface ForumPostDialogProps {
  onPostCreated: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export const ForumPostDialog = ({ onPostCreated }: ForumPostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Fetch forum categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, color')
        .eq('type', 'forum')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      
      // Set default category if available
      if (data && data.length > 0 && !category) {
        setCategory(data[0].name);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // If user is not logged in, show login prompt
  if (!user || !profile) {
    return (
      <Button asChild size="default" className="sm:w-auto">
        <Link to="/auth" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Autentifică-te pentru a posta
        </Link>
      </Button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !category) {
      toast({
        title: "Informații lipsă",
        description: "Te rugăm să completezi toate câmpurile inclusiv categoria",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          category: category,
          author_name: profile.display_name,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Postarea a fost creată cu succes!",
        description: "Postarea ta a fost adăugată în forum.",
      });

      setTitle("");
      setContent("");
      setCategory(categories.length > 0 ? categories[0].name : "");
      setOpen(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Eroare la crearea postării",
        description: "Te rugăm să încerci din nou mai târziu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="default" className="sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Postare Nouă
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Creează Postare Nouă</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Postezi ca</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{profile.display_name}</p>
              {profile.company_name && (
                <p className="text-xs text-muted-foreground">{profile.company_name}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categorie</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selectează o categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      ></div>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Titlu</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Care este întrebarea sau subiectul tău?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conținut</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Împărtășește-ți gândurile, pune o întrebare sau începe o discuție..."
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Se creează..." : "Creează Postarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};