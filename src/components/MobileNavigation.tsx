import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Calendar, Users, ShoppingBag, MapPin, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNavigation = () => {
  const location = useLocation();

  const navItems = [
    { name: "Acasă", href: "/", icon: Home },
    { name: "Flux", href: "/feed", icon: Rss },
    { name: "Forum", href: "/forum", icon: MessageSquare },
    { name: "Evenimente", href: "/events", icon: Calendar },
    { name: "Servicii", href: "/services", icon: MapPin },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1",
                isActive(item.href)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;