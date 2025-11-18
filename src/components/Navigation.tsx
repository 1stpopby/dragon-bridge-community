import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, MessageSquare, Calendar, Users, ShoppingBag, BookOpen, MapPin, Settings, Rss } from "lucide-react";
import { UserButton } from "./UserButton";
import { NotificationSystem } from "./NotificationSystem";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [appSettings, setAppSettings] = useState({
    app_name: "UK Chinese Community",
    app_logo_url: "",
  });

  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['app_name', 'app_logo_url']);

        if (error) throw error;

        const settingsMap: Record<string, any> = {};
        data?.forEach((setting) => {
          try {
            settingsMap[setting.setting_key] = typeof setting.setting_value === 'string' 
              ? JSON.parse(setting.setting_value)
              : setting.setting_value;
          } catch {
            settingsMap[setting.setting_key] = setting.setting_value;
          }
        });

        setAppSettings(prev => ({
          ...prev,
          ...settingsMap,
        }));
      } catch (error) {
        console.error('Error fetching app settings:', error);
      }
    };

    fetchAppSettings();
  }, []);

  const navItems = [
    { name: "Acasă", href: "/", icon: Home },
    { name: "Flux", href: "/feed", icon: Rss },
    { name: "Forum", href: "/forum", icon: MessageSquare },
    { name: "Evenimente", href: "/events", icon: Calendar },
    { name: "Comunitate", href: "/community", icon: Users },
    { name: "Piață", href: "/marketplace", icon: ShoppingBag },

    { name: "Servicii", href: "/services", icon: MapPin },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="bg-background border-b sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {appSettings.app_logo_url ? (
                <img 
                  src={appSettings.app_logo_url} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">中</span>
                </div>
              )}
              <span className="font-bold text-lg sm:text-xl text-foreground hidden xs:block">
                {appSettings.app_name}
              </span>
              <span className="font-bold text-base text-foreground xs:hidden">
                {appSettings.app_name}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            <NotificationSystem />
            <UserButton />
          </div>

          {/* Mobile Navigation - simplified header */}
          <div className="md:hidden flex items-center space-x-2">
            <NotificationSystem />
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;