import React from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

interface Props {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  contentStyle?: React.CSSProperties;
}

export default function DashboardLayout({ title, children, actions, contentStyle }: Props) {
  const mainStyle: React.CSSProperties = {
    flex: 1,
    padding: "32px",
    overflow: "auto",
    ...(contentStyle || {}),
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <DashboardHeader title={title} actions={actions} />
        <main style={mainStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}
