import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Search, Users, Activity, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

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
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="bg-card rounded-2xl p-6 border-2 border-destructive shadow-paper">
            <p className="text-destructive font-handwritten text-lg">Error loading dashboard: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-handwritten text-foreground mb-2">
            Humanode Validator Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {data?.totalValidators || 0} validators in real-time
          </p>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Total Tracked */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-secondary/50 rounded-xl border-2 border-border">
                <Users className="size-4 sm:size-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Tracked</p>
                <p className="text-2xl sm:text-4xl font-handwritten text-primary">
                  {data?.totalValidators || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Currently Active */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-success/20 rounded-xl border-2 border-success/30">
                <Activity className="size-4 sm:size-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Currently Active</p>
                <p className="text-2xl sm:text-4xl font-handwritten text-success">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>

          {/* Current Phrase */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-accent rounded-xl border-2 border-border">
                <TrendingUp className="size-4 sm:size-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Current Phrase</p>
                <p className="text-lg sm:text-2xl font-handwritten">Phrase {data?.currentPhrase}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Epochs {data?.phraseStartEpoch} - {data?.phraseEndEpoch}
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-secondary/50 rounded-xl border-2 border-border">
                <Clock className="size-4 sm:size-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="text-xs sm:text-sm truncate">{formatDateTime(data?.timestamp || null)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Validator Rankings Table */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-handwritten mb-1">Validator Rankings</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Real-time status of all tracked validators</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by validator address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-handwritten whitespace-nowrap ${statusFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-foreground"
                  }`}
              >
                ALL
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-handwritten whitespace-nowrap ${statusFilter === "active"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-foreground"
                  }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-handwritten whitespace-nowrap ${statusFilter === "inactive"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-foreground"
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
                <tr className="border-b-2 border-border border-dashed">
                  <th className="px-2 sm:px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Pass / Fail
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Last Seen Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredValidators.map((validator, index) => (
                  <tr
                    key={validator.address}
                    onClick={() => navigate(`/validator/${validator.address}`)}
                    className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{index + 1}</td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-primary group-hover:underline transition-colors">
                          {validator.address.substring(0, 6)}...
                          {validator.address.substring(validator.address.length - 4)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(validator.address);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedAddress === validator.address ? (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium border-2 ${validator.lastApiHelperState === "active"
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                          }`}
                      >
                        {validator.lastApiHelperState?.toUpperCase() || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">
                      <span className="text-success font-handwritten text-base">{validator.passCount}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-destructive font-handwritten text-base">{validator.failCount}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                      {formatDateTime(validator.lastApiHelperStateChangeTimestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredValidators.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-handwritten text-lg">No validators found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t-2 border-border border-dashed text-center text-sm text-muted-foreground">
          <p className="font-handwritten">&copy; 2025 crxanode. All rights reserved.</p>
          <p className="mt-2">
            GitHub:{" "}
            <a
              href="https://github.com/caraka15"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-colors"
            >
              caraka15
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
