import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading dashboard: {(error as Error).message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Humanode Validator Monitor Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {data?.totalValidators || 0} validators
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{data?.totalValidators || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Currently Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Phrase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-foreground">
                Phrase {data?.currentPhrase}
              </p>
              <p className="text-sm text-muted-foreground">
                Epochs {data?.phraseStartEpoch} - {data?.phraseEndEpoch}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-foreground">
                {formatDateTime(data?.timestamp || null)}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Validator Rankings</CardTitle>
            <CardDescription>
              Real-time status of all tracked validators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                type="text"
                placeholder="Search by validator address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  ALL
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => setStatusFilter("active")}
                  size="sm"
                >
                  ACTIVE
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  onClick={() => setStatusFilter("inactive")}
                  size="sm"
                >
                  INACTIVE
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Validator Address
                    </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Pass / Fail
                      </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Last Seen Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredValidators.map((validator, index) => (
                    <tr
                      key={validator.address}
                      className="border-b border-border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/validator/${validator.address}`)}
                    >
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-primary hover:underline">
                            {validator.address.substring(0, 6)}...
                            {validator.address.substring(validator.address.length - 6)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(validator.address);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedAddress === validator.address ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-bold ${
                            validator.lastApiHelperState === "active"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {validator.lastApiHelperState?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-green-600 font-semibold">{validator.passCount}</span>
                          {" / "}
                          <span className="text-red-600 font-semibold">{validator.failCount}</span>
                        </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(validator.lastApiHelperStateChangeTimestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredValidators.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No validators found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="text-center py-8 mt-8">
          <p className="text-sm text-muted-foreground">&copy; 2025 crxanode. All rights reserved.</p>
          <p className="text-sm text-muted-foreground">
            GitHub:{" "}
            <a
              href="https://github.com/caraka15"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
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
