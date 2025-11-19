import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Camera } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AdminProfileSettings = () => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    contact_email: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setFormData({
        display_name: data.display_name || '',
        contact_email: data.contact_email || user.email || '',
        new_password: '',
        confirm_password: '',
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          contact_email: formData.contact_email,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          throw new Error("Parolele nu se potrivesc");
        }

        if (formData.new_password.length < 6) {
          throw new Error("Parola trebuie să aibă cel puțin 6 caractere");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.new_password
        });

        if (passwordError) throw passwordError;

        // Clear password fields
        setFormData(prev => ({
          ...prev,
          new_password: '',
          confirm_password: '',
        }));
      }

      // Update email if changed
      if (formData.contact_email !== user?.email && formData.contact_email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.contact_email
        });

        if (emailError) throw emailError;
      }

      toast({
        title: "Profil actualizat",
        description: "Modificările au fost salvate cu succes",
      });

      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Nu s-a putut actualiza profilul",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = formData.display_name 
    ? formData.display_name.split(' ').map(name => name.charAt(0)).join('').toUpperCase()
    : user?.email?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profil Administrator</h2>
        <p className="text-muted-foreground">Gestionează informațiile contului tău</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informații Personale</CardTitle>
          <CardDescription>Actualizează datele profilului tău</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} alt="Profile" />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Button type="button" variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Schimbă Avatar
                </Button>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Nume Afișat</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Numele tău"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="email@exemplu.com"
                  />
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Schimbă Parola</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">Parolă Nouă</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Minim 6 caractere"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmă Parola</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="Confirmă parola nouă"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Lasă câmpurile goale dacă nu dorești să schimbi parola
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Se salvează..." : "Salvează Modificările"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
