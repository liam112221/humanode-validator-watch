import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Search, Users, Activity, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

type ValidatorData = {
  address: string;
  passCount: number;
  failCount: number;
  totalEpochs: number;
  lastApiHelperState: string | null;
  lastApiHelperStateChangeTimestamp: string | null;
};

type DashboardData = {
  currentPhrase: number;
  phraseStartEpoch: number;
  phraseEndEpoch: number;
  phraseStartTime: string;
  validators: ValidatorData[];
  totalValidators: number;
  constants: any;
  timestamp: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(date).replace(/\//g, "-");
    } catch {
      return "N/A";
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 1500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const filteredValidators = data?.validators.filter((validator) => {
    const matchesSearch = validator.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && validator.lastApiHelperState === "active") ||
      (statusFilter === "inactive" && validator.lastApiHelperState === "inactive");
    return matchesSearch && matchesStatus;
  }) || [];

  const activeCount = data?.validators.filter(v => v.lastApiHelperState === "active").length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/50">
            <p className="text-red-400">Error loading dashboard: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl mb-2 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Humanode Validator Monitor Dashboard
            </h1>
            <p className="text-sm text-zinc-400">
              Monitoring {data?.totalValidators || 0} validators in real-time
            </p>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Tracked */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/20">
                  <Users className="size-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-1">Total Tracked</p>
                  <p className="text-3xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {data?.totalValidators || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Currently Active */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/20">
                  <Activity className="size-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-1">Currently Active</p>
                  <p className="text-3xl bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    {activeCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Phrase */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-xl border border-orange-500/20">
                  <TrendingUp className="size-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-1">Current Phrase</p>
                  <p className="text-xl">Phrase {data?.currentPhrase}</p>
                  <p className="text-xs text-zinc-500">
                    Epochs {data?.phraseStartEpoch} - {data?.phraseEndEpoch}
                  </p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
                  <Clock className="size-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-1">Last Updated</p>
                  <p className="text-sm">{formatDateTime(data?.timestamp || null)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Validator Rankings Table */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50">
            <div className="mb-6">
              <h2 className="text-2xl mb-1">Validator Rankings</h2>
              <p className="text-sm text-zinc-400">Real-time status of all tracked validators</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by validator address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-lg border transition-all text-sm ${statusFilter === "all"
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-4 py-2 rounded-lg border transition-all text-sm ${statusFilter === "active"
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                >
                  ACTIVE
                </button>
                <button
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-4 py-2 rounded-lg border transition-all text-sm ${statusFilter === "inactive"
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                >
                  INACTIVE
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      Validator Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      Pass / Fail
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      Last Seen Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredValidators.map((validator, index) => (
                    <tr
                      key={validator.address}
                      onClick={() => navigate(`/validator/${validator.address}`)}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-4 text-sm text-zinc-400">{index + 1}</td>
                      <td className="px-4 py-4 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400 group-hover:text-orange-300 transition-colors">
                            {validator.address.substring(0, 6)}...
                            {validator.address.substring(validator.address.length - 6)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(validator.address);
                            }}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {copiedAddress === validator.address ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${validator.lastApiHelperState === "active"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                        >
                          {validator.lastApiHelperState?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="text-emerald-400">{validator.passCount}</span>
                        <span className="text-zinc-600"> / </span>
                        <span className="text-red-400">{validator.failCount}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {formatDateTime(validator.lastApiHelperStateChangeTimestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredValidators.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">No validators found matching your filters.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-zinc-800/50 text-center text-sm text-zinc-600">
            <p>&copy; 2025 crxanode. All rights reserved.</p>
            <p className="mt-2">
              GitHub:{" "}
              <a
                href="https://github.com/caraka15"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                caraka15
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
