import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchLogoUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'app_logo_url')
          .single();

        if (error) throw error;
        
        const url = typeof data.setting_value === 'string' 
          ? JSON.parse(data.setting_value)
          : data.setting_value;
        
        setLogoUrl(url);
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchLogoUrl();
  }, []);

  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="RoEu" className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">中</span>
                </div>
              )}
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              Conectează românii de pretutindeni. Împărtășește experiențe, 
              găsește suport și celebrează cultura noastră împreună.
            </p>
            <div className="text-sm text-muted-foreground">
              © 2025 RoEu Community.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/forum" className="text-muted-foreground hover:text-primary transition-colors">
                  Community Forum
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">
                  Local Events
                </Link>
              </li>

              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Local Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;