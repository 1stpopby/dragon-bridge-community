import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Save, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  Palette, 
  Database,
  Shield,
  Image,
  FileImage
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description: string;
  is_public: boolean;
}

interface AdminSettingsTableProps {
  onDataChange: () => void;
}

export const AdminSettingsTable = ({ onDataChange }: AdminSettingsTableProps) => {
  const [settings, setSettings] = useState<Record<string, AppSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (error) throw error;

      const settingsMap: Record<string, AppSetting> = {};
      const formDataMap: Record<string, any> = {};

      data?.forEach((setting) => {
        settingsMap[setting.setting_key] = setting;
        // Parse JSON values
        try {
          formDataMap[setting.setting_key] = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value)
            : setting.setting_value;
        } catch {
          formDataMap[setting.setting_key] = setting.setting_value;
        }
      });

      setSettings(settingsMap);
      setFormData(formDataMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error loading settings",
        description: "Failed to load application settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (settingKey: string) => {
    try {
      setSaving(true);
      const setting = settings[settingKey];
      const value = formData[settingKey];
      
      // Convert value to appropriate format based on setting type
      let settingValue;
      if (setting.setting_type === 'json') {
        settingValue = JSON.stringify(value);
      } else if (setting.setting_type === 'boolean') {
        settingValue = JSON.stringify(value);
      } else if (setting.setting_type === 'number') {
        settingValue = JSON.stringify(Number(value));
      } else {
        settingValue = JSON.stringify(value);
      }

      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: settingValue })
        .eq('setting_key', settingKey);

      if (error) throw error;

      toast({
        title: "Setting saved",
        description: `${settingKey.replace('_', ' ')} has been updated successfully.`,
      });

      onDataChange();
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: "Error saving setting",
        description: "Failed to save setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      const updates = Object.keys(formData).map(settingKey => {
        const setting = settings[settingKey];
        const value = formData[settingKey];
        
        let settingValue;
        if (setting.setting_type === 'json') {
          settingValue = JSON.stringify(value);
        } else if (setting.setting_type === 'boolean') {
          settingValue = JSON.stringify(value);
        } else if (setting.setting_type === 'number') {
          settingValue = JSON.stringify(Number(value));
        } else {
          settingValue = JSON.stringify(value);
        }

        return supabase
          .from('app_settings')
          .update({ setting_value: settingValue })
          .eq('setting_key', settingKey);
      });

      await Promise.all(updates);

      toast({
        title: "All settings saved",
        description: "All application settings have been updated successfully.",
      });

      onDataChange();
    } catch (error) {
      console.error('Error saving all settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save some settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedFormData = (key: string, nestedKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [nestedKey]: value
      }
    }));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center space-x-2">
            <Settings className="h-6 w-6" />
            <span>Application Settings</span>
          </h2>
          <p className="text-muted-foreground">
            Configure your application's global settings and preferences
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>General Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Application Name</Label>
                  <Input
                    id="app_name"
                    value={formData.app_name || ""}
                    onChange={(e) => updateFormData('app_name', e.target.value)}
                    placeholder="Enter application name"
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.app_name?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_logo_url">Logo URL</Label>
                  <Input
                    id="app_logo_url"
                    value={formData.app_logo_url || ""}
                    onChange={(e) => updateFormData('app_logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL to your application logo
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_description">Application Description</Label>
                <Textarea
                  id="app_description"
                  value={formData.app_description || ""}
                  onChange={(e) => updateFormData('app_description', e.target.value)}
                  placeholder="Enter application description"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.app_description?.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email || ""}
                    onChange={(e) => updateFormData('contact_email', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone || ""}
                    onChange={(e) => updateFormData('contact_phone', e.target.value)}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Street Address"
                    value={formData.address?.street || ""}
                    onChange={(e) => updateNestedFormData('address', 'street', e.target.value)}
                  />
                  <Input
                    placeholder="City"
                    value={formData.address?.city || ""}
                    onChange={(e) => updateNestedFormData('address', 'city', e.target.value)}
                  />
                  <Input
                    placeholder="Postcode"
                    value={formData.address?.postcode || ""}
                    onChange={(e) => updateNestedFormData('address', 'postcode', e.target.value)}
                  />
                  <Input
                    placeholder="Country"
                    value={formData.address?.country || ""}
                    onChange={(e) => updateNestedFormData('address', 'country', e.target.value)}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Label>Social Media Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Facebook URL"
                    value={formData.social_links?.facebook || ""}
                    onChange={(e) => updateNestedFormData('social_links', 'facebook', e.target.value)}
                  />
                  <Input
                    placeholder="Twitter URL"
                    value={formData.social_links?.twitter || ""}
                    onChange={(e) => updateNestedFormData('social_links', 'twitter', e.target.value)}
                  />
                  <Input
                    placeholder="Instagram URL"
                    value={formData.social_links?.instagram || ""}
                    onChange={(e) => updateNestedFormData('social_links', 'instagram', e.target.value)}
                  />
                  <Input
                    placeholder="LinkedIn URL"
                    value={formData.social_links?.linkedin || ""}
                    onChange={(e) => updateNestedFormData('social_links', 'linkedin', e.target.value)}
                  />
                  <Input
                    placeholder="WeChat ID"
                    value={formData.social_links?.wechat || ""}
                    onChange={(e) => updateNestedFormData('social_links', 'wechat', e.target.value)}
                    className="md:col-span-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Theme & Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme_primary_color">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="theme_primary_color"
                      value={formData.theme_primary_color || ""}
                      onChange={(e) => updateFormData('theme_primary_color', e.target.value)}
                      placeholder="#ef4444"
                    />
                    <input
                      type="color"
                      value={formData.theme_primary_color || "#ef4444"}
                      onChange={(e) => updateFormData('theme_primary_color', e.target.value)}
                      className="w-12 h-10 rounded border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_secondary_color">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="theme_secondary_color"
                      value={formData.theme_secondary_color || ""}
                      onChange={(e) => updateFormData('theme_secondary_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                    <input
                      type="color"
                      value={formData.theme_secondary_color || "#f59e0b"}
                      onChange={(e) => updateFormData('theme_secondary_color', e.target.value)}
                      className="w-12 h-10 rounded border"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_favicon_url">Favicon URL</Label>
                <Input
                  id="app_favicon_url"
                  value={formData.app_favicon_url || ""}
                  onChange={(e) => updateFormData('app_favicon_url', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
                <p className="text-xs text-muted-foreground">
                  URL to your application favicon (16x16 or 32x32 pixels)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registration Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register for accounts
                  </p>
                </div>
                <Switch
                  checked={formData.registration_enabled || false}
                  onCheckedChange={(checked) => updateFormData('registration_enabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable the site for maintenance
                  </p>
                </div>
                <Switch
                  checked={formData.maintenance_mode || false}
                  onCheckedChange={(checked) => updateFormData('maintenance_mode', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max_file_upload_size">Max File Upload Size (MB)</Label>
                <Input
                  id="max_file_upload_size"
                  type="number"
                  value={formData.max_file_upload_size || 10}
                  onChange={(e) => updateFormData('max_file_upload_size', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Advanced Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analytics_tracking_id">Google Analytics Tracking ID</Label>
                <Input
                  id="analytics_tracking_id"
                  value={formData.analytics_tracking_id || ""}
                  onChange={(e) => updateFormData('analytics_tracking_id', e.target.value)}
                  placeholder="GA-XXXXXXXXX-X"
                />
                <p className="text-xs text-muted-foreground">
                  Your Google Analytics tracking ID for website analytics
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>SMTP Email Configuration</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="SMTP Host"
                    value={formData.smtp_settings?.host || ""}
                    onChange={(e) => updateNestedFormData('smtp_settings', 'host', e.target.value)}
                  />
                  <Input
                    placeholder="SMTP Port"
                    type="number"
                    value={formData.smtp_settings?.port || 587}
                    onChange={(e) => updateNestedFormData('smtp_settings', 'port', parseInt(e.target.value))}
                  />
                  <Input
                    placeholder="Username"
                    value={formData.smtp_settings?.username || ""}
                    onChange={(e) => updateNestedFormData('smtp_settings', 'username', e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={formData.smtp_settings?.password || ""}
                    onChange={(e) => updateNestedFormData('smtp_settings', 'password', e.target.value)}
                  />
                  <Input
                    placeholder="From Email"
                    type="email"
                    value={formData.smtp_settings?.from_email || ""}
                    onChange={(e) => updateNestedFormData('smtp_settings', 'from_email', e.target.value)}
                    className="md:col-span-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure SMTP settings for sending system emails
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};