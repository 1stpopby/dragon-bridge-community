import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, MessageSquare, Calendar, Users, ShoppingBag, BookOpen, MapPin, Settings, Rss } from "lucide-react";
import { UserButton } from "./UserButton";
import { NotificationSystem } from "./NotificationSystem";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Feed", href: "/feed", icon: Rss },
    { name: "Forum", href: "/forum", icon: MessageSquare },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Community", href: "/community", icon: Users },
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { name: "Resources", href: "/resources", icon: BookOpen },
    { name: "Services", href: "/services", icon: MapPin },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="bg-background border-b sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">中</span>
              </div>
              <span className="font-bold text-lg sm:text-xl text-foreground hidden xs:block">
                UK Chinese Community
              </span>
              <span className="font-bold text-base text-foreground xs:hidden">
                Dragon Bridge
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

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <NotificationSystem />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">中</span>
                      </div>
                      <span className="font-bold text-lg text-foreground">Dragon Bridge</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors touch-manipulation ${
                          isActive(item.href)
                            ? "text-primary bg-primary/10"
                            : "text-foreground hover:text-primary hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                    </div>
                  </div>
                  <div className="p-4 border-t bg-muted/30">
                    <UserButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;