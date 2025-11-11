import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Bell, Settings, ArrowRight, Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import { useNotifications } from "../../contexts/NotificationsContext";

interface Props {
  title: string;
  actions?: React.ReactNode;
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
}

export default function DashboardHeader({ title, actions, showSidebarToggle = false, onToggleSidebar }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);
  const { unreadCount, permission, requestPermission } = useNotifications();

  const quickLinks = useMemo(() => [
    { label: "OITs", path: "/dashboard/oit" },
    { label: "Recursos", path: "/dashboard/resources" },
    { label: "Asistente", path: "/dashboard/chat" },
    { label: "Mi Perfil", path: "/dashboard/profile" },
  ], []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 0);
    }
  }, [isSearchOpen]);

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return quickLinks;
    const lower = searchQuery.toLowerCase();
    return quickLinks.filter((link) => link.label.toLowerCase().includes(lower));
  }, [quickLinks, searchQuery]);

  function openSearchModal() {
    setIsSearchOpen(true);
    setSearchQuery("");
    searchInputRef.current?.blur();
  }

  function closeSearchModal() {
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  function handleNavigate(path: string) {
    navigate(path);
    closeSearchModal();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (filteredLinks.length > 0) {
      handleNavigate(filteredLinks[0].path);
    }
  }

  async function handleNotificationsClick() {
    if (permission === "default") {
      await requestPermission();
    }
    navigate("/dashboard/alerts");
  }
  
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        {showSidebarToggle && (
          <button type="button" className="dashboard-header-toggle" onClick={onToggleSidebar} aria-label="Abrir menú">
            <Menu size={18} />
          </button>
        )}
        <h1 className="dashboard-header-title">{title}</h1>
        {actions && <div className="dashboard-header-actions">{actions}</div>}
      </div>

      <div className="dashboard-header-search">
        <Search size={18} className="dashboard-header-search-icon" />
        <input
          type="text"
          placeholder="Buscar (⌘ + F)"
          className="dashboard-header-search-input"
          readOnly
          ref={searchInputRef}
          onFocus={openSearchModal}
          onMouseDown={(e) => {
            e.preventDefault();
            openSearchModal();
          }}
        />
      </div>

      <div className="dashboard-header-right">
        <button
          type="button"
          className="dashboard-header-icon"
          aria-label="Notificaciones"
          onClick={handleNotificationsClick}
          style={{ position: "relative" }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#ef4444",
                color: "white",
                borderRadius: "999px",
                padding: "0 6px",
                fontSize: 10,
                fontWeight: 700,
                lineHeight: "16px",
                minWidth: 16,
                textAlign: "center",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button type="button" className="dashboard-header-icon" aria-label="Configuración">
          <Settings size={18} />
        </button>
        <div className="dashboard-header-user">
          <div className="dashboard-header-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
          </div>
          <div className="dashboard-header-user-info">
            <span>{user?.full_name || user?.email.split("@")[0]}</span>
            <small>Serambiente</small>
          </div>
        </div>
      </div>

      <Modal
        open={isSearchOpen}
        title="Buscar"
        onClose={closeSearchModal}
        actions={null}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            ref={modalInputRef}
            className="input"
            placeholder="Escribe para buscar secciones"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
            {filteredLinks.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>Sin coincidencias.</div>
            ) : (
              filteredLinks.map((link) => (
                <button
                  type="button"
                  key={link.path}
                  onClick={() => handleNavigate(link.path)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <span>{link.label}</span>
                  <ArrowRight size={16} color="#6b7280" />
                </button>
              ))
            )}
          </div>
        </form>
      </Modal>
    </header>
  );
}