import { Home, User, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";

/**
 * Navigation Component
 * Global navigation for the app
 */
const Navigation = () => {
  return (
    <nav className="bg-card border-b border-border mb-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-foreground">
              Humanode Monitor
            </h1>
            
            <div className="flex gap-1">
              <NavLink 
                to="/" 
                end
                className="flex items-center gap-2 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                activeClassName="bg-accent text-foreground font-medium"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              
              <NavLink 
                to="/recap"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                activeClassName="bg-accent text-foreground font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Recap</span>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
