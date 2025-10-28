import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileHeroCard from "../components/profile/ProfileHeroCard";
import ProfileOverviewGrid from "../components/profile/ProfileOverviewGrid";
import ProfileSecuritySection from "../components/profile/ProfileSecuritySection";

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
      <ProfileHeader onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
        <ProfileHeroCard
          fullName={user.full_name || ""}
          email={user.email}
          badges={["Miembro activo", "Plan Profesional"]}
        />
        <ProfileOverviewGrid user={user} />
        <ProfileSecuritySection />
      </div>
    </DashboardLayout>
  );
}
