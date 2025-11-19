import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Receipt, Wrench, MessageSquare, User, Bell, ChevronRight, ChevronLeft, LogOut } from "lucide-react";
import Button from "../ui/Button";
import { cn } from "../../lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ isMobile = false, onClose, onNavigate, onCollapse, className = "", ...rest }: SidebarProps) {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (onCollapse) {
      onCollapse(isCollapsed);
    }
  }, [isCollapsed, onCollapse]);

  const menuItems = [
    { path: "/dashboard/oit", label: "OITs", icon: Receipt },
    { path: "/dashboard/alerts", label: "Alertas", icon: Bell },
    { path: "/dashboard/resources", label: "Recursos", icon: Wrench },
    { path: "/dashboard/chat", label: "Asistente", icon: MessageSquare },
    { path: "/dashboard/profile", label: "Mi Perfil", icon: User },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-card border-r",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
      {...rest}
    >
      <div className={cn("flex items-center p-4", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ALS" className="h-6 w-auto" />
          </div>
        ) : (
          <div className="w-6" />
        )}
        <Button variant="outline" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className={cn("h-8 w-8", isCollapsed ? "mx-auto" : "ml-auto")}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 mt-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const active = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <li key={item.path} className={cn("px-2", isCollapsed && "flex justify-center")}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isCollapsed ? "justify-center w-10 h-10" : "w-full px-3",
                    active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-accent/40"
                  )}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => onNavigate?.()}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="p-4 mt-auto">
          <Button variant="outline" className="w-full justify-center" onClick={onClose}>
            <LogOut className="h-4 w-4 mr-2" />Cerrar menú
          </Button>
        </div>
      )}
    </div>
  );
}