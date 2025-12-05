import { Home, BarChart3, Menu, X } from "lucide-react";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

/**
 * Navigation Component
 * Global navigation with Humanode branding
 */
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-background rounded-sm" />
            </div>
            <div>
              <h1 className="text-xl text-foreground">Humanode Monitor</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Validator Monitoring Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted rounded-lg border border-border transition-all text-sm text-muted-foreground hover:text-foreground"
              activeClassName="!bg-gradient-to-r !from-orange-500 !to-pink-500 !text-white !border-transparent"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/recap"
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted rounded-lg border border-border transition-all text-sm text-muted-foreground hover:text-foreground"
              activeClassName="!bg-gradient-to-r !from-orange-500 !to-pink-500 !text-white !border-transparent"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Recap</span>
            </NavLink>

            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-all"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border/50 space-y-2">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-muted rounded-lg border border-border transition-all text-sm text-muted-foreground hover:text-foreground w-full"
              activeClassName="!bg-gradient-to-r !from-orange-500 !to-pink-500 !text-white !border-transparent"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/recap"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-muted rounded-lg border border-border transition-all text-sm text-muted-foreground hover:text-foreground w-full"
              activeClassName="!bg-gradient-to-r !from-orange-500 !to-pink-500 !text-white !border-transparent"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Recap</span>
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
