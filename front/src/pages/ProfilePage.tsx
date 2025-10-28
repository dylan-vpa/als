import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { User, Mail, LogOut, Shield, Hash, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Forzar refresh del usuario al cargar la página
  React.useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
      setIsLoggingOut(true);
      try {
        await logout();
        navigate("/auth");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        setIsLoggingOut(false);
      } 
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      title="Mi Perfil"
      contentStyle={{ padding: "0 40px 32px 40px" }}
    >
      <div style={{
        margin: "0 -40px 32px",
        padding: "20px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}>
            <span>Dashboard</span>
            <span>›</span>
            <span>Perfil</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#111827" }}>Cuenta de usuario</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Visualiza tu información personal y estado de seguridad.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut size={16} style={{ marginRight: 6 }} /> Cerrar sesión
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
        <Card>
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
            borderRadius: 22,
            padding: 32,
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            color: "#ffffff"
          }}>
            <div style={{
              width: 96,
              height: 96,
              borderRadius: 26,
              background: "rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700
            }}>
              {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{user.full_name || "Usuario sin nombre"}</h2>
              <p style={{ margin: "8px 0 0 0", opacity: 0.88 }}>{user.email}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Miembro activo</span>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Plan Profesional</span>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <User size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Información personal</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Nombre</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{user.full_name || "—"}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Email</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{user.email}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={20} color="#22d3ee" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Rol y permisos</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Rol actual</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{(user as any).role || "Operador"}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Estado</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>Activo</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Hash size={20} color="#4ade80" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Identificadores</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>ID usuario</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{user.id}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Token</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{localStorage.getItem("auth_token")?.substring(0, 16)}...</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={20} color="#22c55e" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Seguridad de la cuenta</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "#f1f5f9" }}>
                <strong style={{ display: "block", fontSize: 13 }}>Autenticación</strong>
                <span style={{ display: "block", marginTop: 4, color: "#64748b", fontSize: 13 }}>Contraseña verificada recientemente.</span>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "#f1f5f9" }}>
                <strong style={{ display: "block", fontSize: 13 }}>2FA</strong>
                <span style={{ display: "block", marginTop: 4, color: "#64748b", fontSize: 13 }}>Pendiente de activar.</span>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "#f1f5f9" }}>
                <strong style={{ display: "block", fontSize: 13 }}>Último acceso</strong>
                <span style={{ display: "block", marginTop: 4, color: "#64748b", fontSize: 13 }}>Hace unas horas.</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
