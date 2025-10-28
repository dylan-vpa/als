import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Receipt, Wrench, MessageSquare, User, X } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ isMobile = false, onClose, onNavigate, className = "", ...rest }: SidebarProps) {
  const { pathname } = useLocation();

  const menuItems = [
    { path: "/dashboard/oit", icon: Receipt, label: "OITs" },
    { path: "/dashboard/resources", icon: Wrench, label: "Recursos" },
    { path: "/dashboard/chat", icon: MessageSquare, label: "Asistente" },
    { path: "/dashboard/profile", icon: User, label: "Mi Perfil" },
  ];

  return (
    <div className={`sidebar-shell ${className}`.trim()} {...rest}>
      <div className="sidebar-header">
        <img src="/logo.png" alt="ALS Logo" className="sidebar-logo" />
        {isMobile && (
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-section-label">Menú</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${active ? "is-active" : ""}`.trim()}
              onClick={() => onNavigate?.()}
            >
              {active && <span className="sidebar-link-indicator" />}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}