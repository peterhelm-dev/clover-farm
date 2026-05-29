import React from "react";
import { Link, useLocation } from "wouter";
import { useApp, UserRole } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Leaf, User, Sprout, ChefHat, ShoppingBag, LogOut, Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const { currentRole, setCurrentRole, currentUser, logout } = useApp();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => location === path;

  const roleDetails = {
    guest: { label: "Guest Mode", icon: Leaf, color: "text-muted-foreground bg-muted" },
    grower: { label: "Silas (Grower)", icon: Sprout, color: "text-primary bg-primary/10" },
    restaurant: { label: "Chef Thomas (Restaurant)", icon: ChefHat, color: "text-destructive bg-destructive/10" },
    consumer: { label: "Jane (Household)", icon: ShoppingBag, color: "text-accent-foreground bg-accent/20" }
  };

  const ActiveIcon = roleDetails[currentRole]?.icon || Leaf;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-primary hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <span>Clover Farm</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className={`transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}>
              Home
            </Link>
            <Link href="/features" className={`transition-colors hover:text-primary ${isActive("/features") ? "text-primary" : "text-muted-foreground"}`}>
              How It Works
            </Link>
            <Link href="/coordination" className={`transition-colors hover:text-primary ${isActive("/coordination") ? "text-primary" : "text-muted-foreground"}`}>
              Coordination
            </Link>
            <Link href="/ai-planner" className={`transition-colors hover:text-primary ${isActive("/ai-planner") ? "text-primary" : "text-muted-foreground"}`}>
              AI Planner
            </Link>
            <Link href="/pricing" className={`transition-colors hover:text-primary ${isActive("/pricing") ? "text-primary" : "text-muted-foreground"}`}>
              Pricing
            </Link>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Dashboard Quick Access */}
          {currentRole !== "guest" && (
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="gap-2">
                <ActiveIcon className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          )}

          {/* Role Simulator Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`gap-2 border border-border/50 px-3 py-1.5 rounded-full ${roleDetails[currentRole]?.color}`}>
                <ActiveIcon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium text-xs">
                  {roleDetails[currentRole]?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Simulate User Roles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentRole("guest")} className="gap-2">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                <span>Guest / Visitor</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentRole("grower")} className="gap-2">
                <Sprout className="h-4 w-4 text-primary" />
                <span>Silas (Grower)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentRole("restaurant")} className="gap-2">
                <ChefHat className="h-4 w-4 text-destructive" />
                <span>Chef Thomas (Restaurant)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentRole("consumer")} className="gap-2">
                <ShoppingBag className="h-4 w-4 text-accent-foreground" />
                <span>Jane (Household)</span>
              </DropdownMenuItem>
              {currentRole !== "guest" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Logout Session</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-1.5 rounded-md border border-border/40 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-md py-4 px-6 animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`hover:text-primary ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}>
              Home
            </Link>
            <Link href="/features" onClick={() => setMobileMenuOpen(false)} className={`hover:text-primary ${isActive("/features") ? "text-primary" : "text-muted-foreground"}`}>
              How It Works
            </Link>
            <Link href="/coordination" onClick={() => setMobileMenuOpen(false)} className={`hover:text-primary ${isActive("/coordination") ? "text-primary" : "text-muted-foreground"}`}>
              Coordination
            </Link>
            <Link href="/ai-planner" onClick={() => setMobileMenuOpen(false)} className={`hover:text-primary ${isActive("/ai-planner") ? "text-primary" : "text-muted-foreground"}`}>
              AI Planner
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className={`hover:text-primary ${isActive("/pricing") ? "text-primary" : "text-muted-foreground"}`}>
              Pricing
            </Link>
            {currentRole !== "guest" && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full gap-2 mt-2">
                  <ActiveIcon className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
