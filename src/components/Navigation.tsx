import { Home, BarChart3 } from "lucide-react";
import { NavLink } from "./NavLink";

/**
 * Navigation Component
 * Global navigation with Humanode branding
 */
const Navigation = () => {
  return (
    <header className="border-b border-zinc-800/50 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0a0a]/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-[#0a0a0a] rounded-sm" />
            </div>
            <div>
              <h1 className="text-xl">Humanode Monitor</h1>
              <p className="text-xs text-zinc-500">Validator Monitoring Dashboard</p>
            </div>
          </div>

          <div className="flex gap-3">
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-all text-sm text-zinc-400 hover:text-white"
              activeClassName="!bg-gradient-to-r !from-orange-500 !to-pink-500 !text-white !border-transparent"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/recap"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-all text-sm text-zinc-400 hover:text-white"
              activeClassName="!bg-gradient-to-r !from-orange-500 !to-pink-500 !text-white !border-transparent"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Recap</span>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
