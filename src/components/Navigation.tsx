import { Home, BarChart3, Menu, X } from "lucide-react";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-border border-dashed sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card rounded-xl border-2 border-border shadow-card flex items-center justify-center">
              <div className="w-5 h-5 bg-primary rounded-md" />
            </div>
            <div>
              <h1 className="text-xl font-handwritten text-foreground">Humanode Monitor</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Validator Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-accent rounded-xl border-2 border-border transition-all text-sm text-muted-foreground hover:text-foreground shadow-card"
              activeClassName="!bg-primary !text-primary-foreground !border-primary"
            >
              <Home className="w-4 h-4" />
              <span className="font-handwritten text-base">Dashboard</span>
            </NavLink>

            <NavLink
              to="/recap"
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-accent rounded-xl border-2 border-border transition-all text-sm text-muted-foreground hover:text-foreground shadow-card"
              activeClassName="!bg-primary !text-primary-foreground !border-primary"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-handwritten text-base">Recap</span>
            </NavLink>

            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-card hover:bg-accent border-2 border-border transition-all shadow-card"
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
          <div className="md:hidden mt-4 pt-4 border-t-2 border-border border-dashed space-y-2">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-accent rounded-xl border-2 border-border transition-all text-sm text-muted-foreground hover:text-foreground w-full shadow-card"
              activeClassName="!bg-primary !text-primary-foreground !border-primary"
            >
              <Home className="w-4 h-4" />
              <span className="font-handwritten text-base">Dashboard</span>
            </NavLink>

            <NavLink
              to="/recap"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-accent rounded-xl border-2 border-border transition-all text-sm text-muted-foreground hover:text-foreground w-full shadow-card"
              activeClassName="!bg-primary !text-primary-foreground !border-primary"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-handwritten text-base">Recap</span>
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
