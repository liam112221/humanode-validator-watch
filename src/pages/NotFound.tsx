import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-red-500/20 via-orange-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-orange-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl border border-red-500/30">
            <AlertTriangle className="size-16 text-red-400" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-[120px] md:text-[180px] leading-none mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-pink-400 bg-clip-text text-transparent font-bold">
          404
        </h1>

        {/* Error Message */}
        <div className="mb-8">
          <p className="text-2xl md:text-3xl mb-3">Oops! Page not found</p>
          <p className="text-zinc-400 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-xs text-zinc-600 mt-2 font-mono">
            {location.pathname}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-lg transition-all text-white shadow-lg shadow-orange-500/20"
          >
            <Home className="size-5" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-all text-zinc-300 hover:text-white"
          >
            Go Back
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-orange-500/50 animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-pink-500/50 animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
