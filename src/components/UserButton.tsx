import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Building2, Settings, MessageSquare, Bell, Store, Home, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceRequestDialog } from "@/components/ServiceRequestDialog";

export const UserButton = () => {
  const { user, profile, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user || !profile) {
    return (
      <Button asChild variant="default">
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = profile.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-background border border-border shadow-lg z-50" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              {profile.account_type === 'company' ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="text-sm font-medium leading-none">
                {profile.display_name}
              </p>
            </div>
            {profile.company_name && (
              <p className="text-xs text-muted-foreground">
                {profile.company_name}
              </p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* My Page for company accounts */}
        {profile.account_type === 'company' && (
          <DropdownMenuItem asChild>
            <Link to={`/company/${profile.id}`} className="cursor-pointer">
              <Home className="mr-2 h-4 w-4" />
              My Page
            </Link>
          </DropdownMenuItem>
        )}
        
        {/* Quick Access Links */}
        <DropdownMenuItem asChild>
          <Link to="/messages" className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/my-marketplace" className="cursor-pointer">
            <Store className="mr-2 h-4 w-4" />
            My Marketplace
          </Link>
         </DropdownMenuItem>
         
         {/* Service Request for non-company accounts */}
         {profile.account_type !== 'company' && (
           <ServiceRequestDialog
             triggerButton={
               <DropdownMenuItem className="cursor-pointer">
                 <HelpCircle className="mr-2 h-4 w-4" />
                 Request Service
               </DropdownMenuItem>
             }
           />
         )}
         
         <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};