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
import { User, LogOut, Building2, Settings, MessageSquare, Bell, Store, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const UserButton = () => {
  const { user, profile, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!user || !profile) {
    return (
      <Button 
        variant="default" 
        onClick={(e) => {
          e.preventDefault();
          navigate('/auth');
        }}
      >
        Autentificare
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

  const menuItems = (
    <>
      <div className="flex flex-col space-y-1 p-4 border-b">
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
      
      <div className="p-2 space-y-1">
        {/* Quick Access Links */}
        <Link 
          to="/messages" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full"
          onClick={() => setIsOpen(false)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </Link>
        
        <Link 
          to="/my-services" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full"
          onClick={() => setIsOpen(false)}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          My Services
        </Link>
        
        <Link 
          to="/notifications" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full"
          onClick={() => setIsOpen(false)}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Link>
        
        <Link 
          to="/my-marketplace" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full"
          onClick={() => setIsOpen(false)}
        >
          <Store className="mr-2 h-4 w-4" />
          My Marketplace
        </Link>
        
        <div className="border-t my-2"></div>
        
        <Link 
          to="/profile" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full"
          onClick={() => setIsOpen(false)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Profile Settings
        </Link>
        
        <div className="border-t my-2"></div>
        
        <button
          onClick={() => {
            handleSignOut();
            setIsOpen(false);
          }}
          disabled={isLoggingOut}
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full text-red-600 hover:text-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </>
  );

  // Mobile version - use Sheet for better touch experience
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          {menuItems}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version - use DropdownMenu
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
        
        {/* Quick Access Links */}
        <DropdownMenuItem asChild>
          <Link to="/messages" className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/my-services" className="cursor-pointer">
            <Briefcase className="mr-2 h-4 w-4" />
            My Services
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