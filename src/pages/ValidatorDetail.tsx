import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useState } from "react";

type EpochData = {
  epochNumber: number;
  status: string;
  totalApiHelperInactiveSeconds: number;
  lastApiHelperState: string | null;
  lastApiHelperStateChangeTimestamp: string | null;
  firstMonitoredTimestamp: string | null;
  globalEpochStartTime: string | null;
  globalFirstBlock: number | null;
  globalSessionLength: number | null;
};

type PhraseHistory = {
  phraseNumber: number;
  startEpoch: number;
  endEpoch: number;
  passCount: number;
  failCount: number;
  otherCount: number;
  isCurrentPhrase: boolean;
  hasDataForThisPhrase: boolean;
};

type ValidatorDetailData = {
  validatorAddress: string;
  errorMessage: string | null;
  latestPhraseNumber: number;
  latestPhraseStartEpoch: number;
  latestPhraseEndEpoch: number;
  actualPhraseStartTimeForDisplay: string;
  constants: any;
  phraseData: any;
  allEpochsInLatestPhrase: EpochData[];
  phraseHistory: PhraseHistory[];
  allPhrasesData: Record<string, any>;
  timestamp: string;
};

type NetworkEpochProgress = {
  currentEpochSystem: number;
  blocksInEpoch: number;
  currentBlockInEpoch: number;
  remainingBlocksInEpoch: number;
  percentageCompleted: number;
  nextEpochETASec: number;
  estimatedEpochCompletionTime: string;
  currentAbsoluteBlock: number;
  error: string | null;
};

type NetworkStatusData = {
  webServerEpochProgress: NetworkEpochProgress;
};

const ValidatorDetail = () => {
  const { address } = useParams();
  const navigate = useNavigate();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const { data, isLoading, error } = useQuery<ValidatorDetailData>({
    queryKey: ["validator", address],
    queryFn: async () => {
      const response = await fetch(`/api/validator/${address}`);
      if (!response.ok) throw new Error("Failed to fetch validator data");
      return response.json();
    },
    enabled: !!address,
    refetchInterval: 60000,
  });

  const { data: networkStatus } = useQuery<NetworkStatusData>({
    queryKey: ["network-status"],
    queryFn: async () => {
      const response = await fetch("/api/network-status");
      if (!response.ok) throw new Error("Failed to fetch network status");
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

  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  const getEpochStatusColor = (status: string): string => {
    switch (status) {
      case "PASS_API_HELPER":
        return "bg-green-500";
      case "FAIL_API_HELPER":
        return "bg-red-500";
      case "BERJALAN":
        return "bg-blue-500 animate-pulse";
      case "NO_DATA":
        return "bg-gray-300";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading validator data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || data?.errorMessage) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                {data?.errorMessage || (error as Error).message}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-7xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          {networkStatus?.webServerEpochProgress && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Current Network Epoch Progress (Epoch{" "}
                  {networkStatus.webServerEpochProgress.currentEpochSystem})
                </CardTitle>
                <CardDescription>
                  Live epoch progress from Humanode network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            networkStatus.webServerEpochProgress.percentageCompleted
                          )
                        ).toFixed(2)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {networkStatus.webServerEpochProgress.percentageCompleted.toFixed(2)}%
                    {" "}completed
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Blocks in Epoch</p>
                    <p className="font-semibold">
                      {networkStatus.webServerEpochProgress.currentBlockInEpoch.toLocaleString()}
                      {" / "}
                      {networkStatus.webServerEpochProgress.blocksInEpoch.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining Blocks</p>
                    <p className="font-semibold">
                      {networkStatus.webServerEpochProgress.remainingBlocksInEpoch.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimated Next Epoch In</p>
                    <p className="font-semibold">
                      {formatDuration(networkStatus.webServerEpochProgress.nextEpochETASec)}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Estimated Epoch Completion Time</p>
                    <p className="font-semibold">
                      {formatDateTime(
                        networkStatus.webServerEpochProgress.estimatedEpochCompletionTime
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Network Block</p>
                    <p className="font-semibold">
                      {networkStatus.webServerEpochProgress.currentAbsoluteBlock.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Validator Detail
            </h1>
            <p className="text-sm text-muted-foreground font-mono break-all">
            {data?.validatorAddress}
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Phrase Information</CardTitle>
            <CardDescription>Phrase {data?.latestPhraseNumber}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Epoch</p>
                <p className="text-lg font-semibold">{data?.latestPhraseStartEpoch}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Epoch</p>
                <p className="text-lg font-semibold">{data?.latestPhraseEndEpoch}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Phrase Start Time</p>
                <p className="text-lg font-semibold">
                  {formatDateTime(data?.actualPhraseStartTimeForDisplay || null)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Epoch History Grid</CardTitle>
            <CardDescription>
              Color-coded epoch status for current phrase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 lg:grid-cols-21 gap-2 mb-4">
              {data?.allEpochsInLatestPhrase?.map((epoch) => (
                <div
                  key={epoch.epochNumber}
                  className={`group relative w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-transform hover:scale-110 ${getEpochStatusColor(
                    epoch.status
                  )}`}
                  title={`Epoch ${epoch.epochNumber}: ${epoch.status}`}
                >
                  <span className="opacity-80">
                    {epoch.epochNumber % 10}
                  </span>
                  
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64 bg-popover border border-border rounded-md p-3 shadow-lg text-xs text-popover-foreground">
                    <p className="font-bold mb-1">Epoch {epoch.epochNumber}</p>
                    <p><strong>Status:</strong> {epoch.status}</p>
                    <p><strong>Inactive Time:</strong> {formatDuration(epoch.totalApiHelperInactiveSeconds)}</p>
                    {epoch.lastApiHelperStateChangeTimestamp && (
                      <p><strong>Last Change:</strong> {formatDateTime(epoch.lastApiHelperStateChangeTimestamp)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>PASS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>FAIL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500 animate-pulse"></div>
                <span>RUNNING</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-300"></div>
                <span>NO DATA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Phrase History</CardTitle>
                <CardDescription>
                  Historical performance across all phrases
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setHistoryExpanded(!historyExpanded)}
              >
                {historyExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </CardHeader>
          {historyExpanded && (
            <CardContent>
              <div className="space-y-4">
                {data?.phraseHistory?.map((phrase) => (
                  <Card key={phrase.phraseNumber} className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Phrase {phrase.phraseNumber}
                        {phrase.isCurrentPhrase && (
                          <span className="ml-2 text-sm text-primary">(Current)</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Epochs {phrase.startEpoch} - {phrase.endEpoch}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">{phrase.passCount}</p>
                          <p className="text-sm text-muted-foreground">PASS</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{phrase.failCount}</p>
                          <p className="text-sm text-muted-foreground">FAIL</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-600">{phrase.otherCount}</p>
                          <p className="text-sm text-muted-foreground">OTHER</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <footer className="text-center py-8 mt-8">
          <p className="text-sm text-muted-foreground">&copy; 2025 crxanode. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ValidatorDetail;
