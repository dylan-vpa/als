import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

interface Props {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  contentStyle?: React.CSSProperties;
}

export default function DashboardLayout({ title, children, actions, contentStyle }: Props) {
  const isWindow = typeof window !== "undefined";
  const [isMobile, setIsMobile] = useState<boolean>(() => (isWindow ? window.innerWidth <= 1024 : false));
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => (isWindow ? window.innerWidth > 1024 : true));
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (!isWindow) return;
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = (matches: boolean) => {
      setIsMobile(matches);
      setSidebarOpen(matches ? false : true);
    };
    update(mql.matches);
    const listener = (event: MediaQueryListEvent) => update(event.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", listener);
    } else {
      mql.addListener(listener);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", listener);
      } else {
        mql.removeListener(listener);
      }
    };
  }, [isWindow]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Calcular el padding izquierdo basado en el estado de la sidebar
  const leftPadding = isMobile ? "" : sidebarCollapsed ? "md:pl-20" : "md:pl-64";
  const mainWidth = isMobile ? "w-full" : sidebarCollapsed ? "md:w-[calc(100%-5rem)]" : "md:w-[calc(100%-16rem)]";

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && (
        <aside className={`fixed inset-y-0 left-0 z-30 hidden md:block ${sidebarCollapsed ? "w-20" : "w-64"}`}>
          <Sidebar isMobile={false} onCollapse={handleSidebarCollapse} />
        </aside>
      )}

      {isMobile && (
        <>
          <aside className={`${sidebarOpen ? "block" : "hidden"} fixed inset-y-0 left-0 z-30 w-64`}>
            <Sidebar isMobile={true} onClose={handleCloseSidebar} onNavigate={handleCloseSidebar} />
          </aside>
          {sidebarOpen && (
            <button type="button" className="fixed inset-0 bg-black/50 z-20" onClick={handleCloseSidebar} aria-label="Cerrar menú" />
          )}
        </>
      )}

      <div className={`flex min-h-screen flex-col transition-all duration-300 ${leftPadding}`}>
        <DashboardHeader title={title} actions={actions} showSidebarToggle={isMobile} onToggleSidebar={handleToggleSidebar} />
        <main className={`flex-1 px-6 py-6 max-w-7xl ${mainWidth} mx-auto transition-all duration-300`} style={contentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}
