import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Bell, Settings, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";

interface Props {
  title: string;
  actions?: React.ReactNode;
}

export default function DashboardHeader({ title, actions }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

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
  
  return (
    <div style={{
      background: "white",
      borderBottom: "1px solid #e5e7eb",
      padding: "16px 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 10,
      gap: "24px"
    }}>
      {/* Left: Search */}
      <div style={{ flex: 1, maxWidth: 420 }}>
        <div style={{
          position: "relative",
          width: "100%"
        }}>
          <Search 
            size={18} 
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af"
            }}
          />
          <input
            type="text"
            placeholder="Search (⌘ + F)"
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              openSearchModal();
            }}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            onMouseDown={(e) => {
              e.preventDefault();
              openSearchModal();
            }}
            readOnly
            ref={searchInputRef}
          />
        </div>
      </div>

      {/* Right: Icons, User, Optional actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={(e) => e.currentTarget.style.background = "white"}
        >
          <Bell size={18} color="#6b7280" />
        </button>

        <button style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={(e) => e.currentTarget.style.background = "white"}
        >
          <Settings size={18} color="#6b7280" />
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "6px 12px 6px 6px",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          background: "white"
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "600",
            fontSize: "14px"
          }}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              {user?.full_name || user?.email.split('@')[0]}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              UI/UX Designer
            </div>
          </div>
        </div>
      </div>

      {actions && <div>{actions}</div>}

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
    </div>
  );
}