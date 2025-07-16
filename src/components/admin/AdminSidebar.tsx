import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Tags,
  Calendar,
  MessageSquare,
  ShoppingBag,
  FileText,
  Bell,
  UserCog,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Activity,
  BarChart3,
  Package,
  Globe,
  Megaphone,
  FileText as FileTextIcon,
  Zap
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuGroups = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        value: "dashboard",
        icon: LayoutDashboard,
        description: "Analytics and overview"
      }
    ]
  },
  {
    label: "User Management",
    items: [
      {
        title: "Users",
        value: "users",
        icon: Users,
        description: "Manage user accounts"
      },
      {
        title: "User Roles",
        value: "roles",
        icon: UserCog,
        description: "Manage permissions"
      },
      {
        title: "User Bans",
        value: "bans",
        icon: Shield,
        description: "Banned users"
      }
    ]
  },
  {
    label: "Content Management",
    items: [
      {
        title: "Categories",
        value: "categories",
        icon: Tags,
        description: "Organize content"
      },
      {
        title: "Events",
        value: "events",
        icon: Calendar,
        description: "Community events"
      },
      {
        title: "Groups",
        value: "groups",
        icon: Users,
        description: "Community groups"
      },
      {
        title: "Marketplace",
        value: "marketplace",
        icon: ShoppingBag,
        description: "Buy & sell items"
      },
      {
        title: "Resources",
        value: "resources",
        icon: FileText,
        description: "Knowledge base"
      },
      {
        title: "Services",
        value: "services",
        icon: Package,
        description: "Business services"
      }
    ]
  },
  {
    label: "Communication",
    items: [
      {
        title: "Announcements",
        value: "announcements",
        icon: Megaphone,
        description: "Schedule announcements"
      },
      {
        title: "Advertisements",
        icon: Megaphone,
        value: "advertisements",
        description: "Manage site advertisements",
      },
      {
        title: "Forum Posts",
        value: "posts",
        icon: MessageSquare,
        description: "Discussion topics"
      },
      {
        title: "Replies",
        value: "replies",
        icon: MessageSquare,
        description: "Forum responses"
      },
      {
        title: "Notifications",
        value: "notifications",
        icon: Bell,
        description: "System alerts"
      }
    ]
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Settings",
        value: "settings",
        icon: Settings,
        description: "App configuration"
      },
      {
        title: "Footer Pages",
        value: "footer-pages",
        icon: FileTextIcon,
        description: "Manage static pages"
      }
    ]
  }
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAdminAuth();
  const { toast } = useToast();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    menuGroups.map(group => group.label)
  );

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupLabel)
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMenuCls = (value: string) =>
    activeTab === value 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-2 px-4 py-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">Admin Panel</h2>
                <Badge variant="secondary" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <Collapsible
              open={expandedGroups.includes(group.label)}
              onOpenChange={() => toggleGroup(group.label)}
            >
              {!collapsed && (
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="group/label text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer flex items-center justify-between py-2">
                    <span>{group.label}</span>
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/label:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
              )}
              
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isDisabled = (item as any).disabled;
                      return (
                        <SidebarMenuItem key={item.value}>
                          <SidebarMenuButton
                            className={`${getMenuCls(item.value)} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isDisabled && onTabChange(item.value)}
                            tooltip={collapsed ? item.title : undefined}
                            disabled={isDisabled}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {!collapsed && (
                              <div className="min-w-0">
                                <span className="font-medium truncate">{item.title}</span>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </p>
                              </div>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-3">
          {!collapsed && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium truncate">Signed in as:</p>
              <p className="truncate">{user?.email}</p>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>

      {/* Toggle button for mobile */}
      <SidebarTrigger className="absolute -right-4 top-4 z-10 bg-background border shadow-md md:hidden" />
    </Sidebar>
  );
}