import React, { createContext, useContext, useState } from "react";

type TabType = "dashboard" | "logs" | "recipes" | "profile" | "settings" | "mealplan" | "water";

interface DashboardTabContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const DashboardTabContext = createContext<DashboardTabContextType | undefined>(undefined);

export function DashboardTabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  return (
    <DashboardTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </DashboardTabContext.Provider>
  );
}

export function useDashboardTab() {
  const context = useContext(DashboardTabContext);
  if (!context) {
    throw new Error("useDashboardTab must be used within DashboardTabProvider");
  }
  return context;
}
