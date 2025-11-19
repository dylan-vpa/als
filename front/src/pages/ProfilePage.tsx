import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProfileHeroCard from "../components/profile/ProfileHeroCard";
import ProfileOverviewGrid from "../components/profile/ProfileOverviewGrid";
import ProfileSecuritySection from "../components/profile/ProfileSecuritySection";
import Button from "../components/ui/Button";
import { LogOut } from "lucide-react";

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
        navigate("/register");
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
      actions={
        <Button variant="primary" onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut size={16} className="mr-2" /> Cerrar sesión
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto grid gap-6">
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
