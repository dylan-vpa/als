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

  return (
    <div className="dashboard-shell">
      <aside
        className={`dashboard-sidebar ${isMobile ? "dashboard-sidebar--mobile" : ""} ${sidebarOpen ? "is-open" : ""}`.trim()}
      >
        <Sidebar
          isMobile={isMobile}
          onClose={handleCloseSidebar}
          onNavigate={handleCloseSidebar}
        />
      </aside>

      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="dashboard-sidebar-overlay"
          onClick={handleCloseSidebar}
          aria-label="Cerrar menú"
        />
      )}

      <div className="dashboard-main">
        <DashboardHeader
          title={title}
          actions={actions}
          showSidebarToggle={isMobile}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="dashboard-content" style={contentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}
