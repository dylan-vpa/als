import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Receipt, Wrench, MessageSquare, User } from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();

  const menuItems = [
    { path: "/dashboard/oit", icon: Receipt, label: "OITs" },
    { path: "/dashboard/resources", icon: Wrench, label: "Recursos" },
    { path: "/dashboard/chat", icon: MessageSquare, label: "Asistente" },
    { path: "/dashboard/profile", icon: User, label: "Mi Perfil" },
  ];

  return (
    <aside style={{
      width: "260px",
      background: "#ffffff",
      height: "100vh",
      position: "sticky",
      top: 0,
      display: "flex",
      flexDirection: "column",
      padding: "32px 20px",
      borderRight: "1px solid #e5e7eb"
    }}>
      {/* Logo */}
      <div style={{ marginBottom: "40px", padding: "0 8px" }}>
        <img 
          src="/logo.png" 
          alt="ALS Logo" 
          style={{ 
            height: "40px", 
            width: "auto",
            display: "block"
          }}
        />
      </div>

      {/* Menu Label */}
      <div style={{
        color: "#9ca3af",
        fontSize: "11px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        padding: "0 12px",
        marginBottom: "16px"
      }}>
        MENU
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                borderRadius: "12px",
                textDecoration: "none",
                color: active ? "#111827" : "#6b7280",
                background: active ? "#f3f4f6" : "transparent",
                transition: "all 0.2s",
                fontWeight: active ? "600" : "500",
                fontSize: "15px",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.color = "#111827";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {active && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "24px",
                  background: "#667eea",
                  borderRadius: "0 4px 4px 0"
                }} />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}