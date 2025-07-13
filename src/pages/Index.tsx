import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import CommunityStats from "@/components/CommunityStats";
import RecentDiscussions from "@/components/RecentDiscussions";
import UpcomingEvents from "@/components/UpcomingEvents";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const Index = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, user, isAdmin, loading } = useAdminAuth();
  const { toast } = useToast();

  // Secret key combination to show admin login (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminLogin(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect if already authenticated as admin
  if (!loading && user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message || "An error occurred during login.",
            variant: "destructive",
          });
        }
        setIsSubmitting(false);
      } else {
        // Success - show toast but keep loading until redirect happens
        toast({
          title: "Login successful",
          description: "Redirecting to admin panel...",
        });
        
        // Wait a bit for auth state to update, then close dialog
        setTimeout(() => {
          setShowAdminLogin(false);
          setIsSubmitting(false);
          // Clear form
          setEmail("");
          setPassword("");
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <CommunityStats />
      <RecentDiscussions />
      <UpcomingEvents />
      
      {/* Hidden Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Admin Login</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAdminLogin(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Index;
