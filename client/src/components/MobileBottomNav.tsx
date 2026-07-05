import { Home, LogIn, BookOpen, User, Settings } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useDashboardTab } from "@/contexts/DashboardTabContext";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useDashboardTab();

  if (!user) return null;

  const navItems = [
    { label: "Home", icon: Home, tab: "dashboard" as const },
    { label: "Logs", icon: LogIn, tab: "voice-logger" as const },
    { label: "Recipes", icon: BookOpen, tab: "recipes" as const },
    { label: "Billing", icon: User, tab: "billing" as const },
    { label: "Settings", icon: Settings, tab: "integrations" as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border md:hidden z-40">
      <div className="flex justify-around items-center h-16 max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
