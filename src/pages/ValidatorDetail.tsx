import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle, Clock, Grid3x3, TrendingUp, ArrowLeft, ChevronDown, ChevronUp, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Navigation from "@/components/Navigation";
import ValidatorDetailSkeleton from "@/components/skeletons/ValidatorDetailSkeleton";

const AVG_BLOCK_TIME_SECONDS = 6;

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

const AnimatedBlockNumber = ({ block }: { block: number }) => {
  const blockString = block.toLocaleString();
  const digits = blockString.split('');

  return (
    <div className="flex items-center justify-start gap-0.5">
      {digits.map((char, index) => {
        // For commas and non-numeric characters, don't animate
        if (char === ',' || char === '.') {
          return (
            <span
              key={`separator-${index}`}
              className="text-lg sm:text-2xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent px-0.5"
            >
              {char}
            </span>
          );
        }

        // For digits, animate individually
        return (
          <div key={`digit-${index}`} className="relative inline-block h-8 sm:h-10" style={{ width: '1em' }}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${index}-${char}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-lg sm:text-2xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

const ValidatorDetail = () => {
  const { address } = useParams();
  const navigate = useNavigate();
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [blockProgress, setBlockProgress] = useState<number>(0);

  // Local real-time epoch data
  const [currentBlockInEpoch, setCurrentBlockInEpoch] = useState<number>(0);
  const [remainingBlocksInEpoch, setRemainingBlocksInEpoch] = useState<number>(0);
  const [nextEpochETASec, setNextEpochETASec] = useState<number>(0);
  const [percentageCompleted, setPercentageCompleted] = useState<number>(0);
  const [blocksInEpoch, setBlocksInEpoch] = useState<number>(2400); // default value

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

  // Initialize current block from network status
  useEffect(() => {
    if (networkStatus?.webServerEpochProgress?.currentAbsoluteBlock) {
      setCurrentBlock(networkStatus.webServerEpochProgress.currentAbsoluteBlock);
    }
  }, [networkStatus?.webServerEpochProgress?.currentAbsoluteBlock]);

  // Initialize epoch data from network status
  useEffect(() => {
    if (networkStatus?.webServerEpochProgress) {
      const progress = networkStatus.webServerEpochProgress;
      setCurrentBlockInEpoch(progress.currentBlockInEpoch);
      setRemainingBlocksInEpoch(progress.remainingBlocksInEpoch);
      setNextEpochETASec(progress.nextEpochETASec);
      setPercentageCompleted(progress.percentageCompleted);
      setBlocksInEpoch(progress.blocksInEpoch);
    }
  }, [networkStatus?.webServerEpochProgress]);

  // Block timer - increment every AVG_BLOCK_TIME_SECONDS
  useEffect(() => {
    const blockInterval = setInterval(() => {
      setCurrentBlock((prev) => prev + 1);
      setCurrentBlockInEpoch((prev) => prev + 1);
      setRemainingBlocksInEpoch((prev) => Math.max(0, prev - 1));
      setBlockProgress(0);

      // Recalculate percentage
      setPercentageCompleted((prev) => {
        const newCurrent = currentBlockInEpoch + 1;
        return (newCurrent / blocksInEpoch) * 100;
      });
    }, AVG_BLOCK_TIME_SECONDS * 1000);

    return () => clearInterval(blockInterval);
  }, [currentBlockInEpoch, blocksInEpoch]);

  // Progress bar for next block
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setBlockProgress((prev) => {
        const increment = (100 / AVG_BLOCK_TIME_SECONDS);
        const next = prev + increment;
        return next >= 100 ? 100 : next;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, []);

  // Countdown timer for next epoch - update every second
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNextEpochETASec((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Real-time clock - update every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

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

  const formatCurrentTime = (): string => {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(currentTime).replace(/\//g, "-");
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
        return "bg-emerald-500";
      case "FAIL_API_HELPER":
        return "bg-red-500";
      case "BERJALAN":
        return "bg-gradient-to-r from-orange-500 to-pink-500";
      case "NO_DATA":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return <ValidatorDetailSkeleton />;
  }

  if (error || data?.errorMessage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Ambient Gradient Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-red-500/20 via-orange-500/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8">
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-destructive/20 backdrop-blur-sm rounded-2xl p-6 border border-destructive/50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/20 rounded-xl border border-destructive/30">
                <AlertCircle className="size-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl mb-2">Error Loading Validator</h3>
                <p className="text-destructive">
                  {data?.errorMessage || (error as Error).message}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          {/* Network Epoch Progress */}
          {networkStatus?.webServerEpochProgress && (
            <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-border transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-xl border border-orange-500/20">
                    <TrendingUp className="size-4 sm:size-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl mb-1">Current Network Epoch Progress</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Epoch {networkStatus.webServerEpochProgress.currentEpochSystem}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full relative transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, percentageCompleted)).toFixed(2)}%`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 animate-pulse opacity-50" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm mt-3 text-muted-foreground">
                  {percentageCompleted.toFixed(2)}% completed • {currentBlockInEpoch.toLocaleString()} of {blocksInEpoch.toLocaleString()} blocks
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Blocks in Epoch</p>
                  <p className="text-lg sm:text-2xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                    {currentBlockInEpoch.toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    of {blocksInEpoch.toLocaleString()}
                  </p>
                </div>
                <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Remaining Blocks</p>
                  <p className="text-lg sm:text-2xl">
                    {remainingBlocksInEpoch.toLocaleString()}
                  </p>
                </div>
                <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Est. Next Epoch In</p>
                  <p className="text-lg sm:text-2xl">
                    {formatDuration(nextEpochETASec)}
                  </p>
                </div>
                <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Est. Epoch Completion Time</p>
                  <p className="text-sm sm:text-lg">
                    {formatDateTime(networkStatus.webServerEpochProgress.estimatedEpochCompletionTime)}
                  </p>
                </div>
                <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Current Network Block</p>
                  <div className="overflow-hidden">
                    <AnimatedBlockNumber block={currentBlock} />
                  </div>
                </div>
                <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Live Time (WIB)</p>
                  <p className="text-sm sm:text-lg font-mono">
                    {formatCurrentTime()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validator Detail Header */}
          <div className="mb-6">
            <h2 className="text-base sm:text-lg mb-3 text-muted-foreground">Validator Detail</h2>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 inline-block max-w-full">
              <code className="text-[10px] sm:text-xs text-orange-400 font-mono break-all">
                {data?.validatorAddress}
              </code>
            </div>
          </div>

          {/* Current Phrase Info */}
          <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-border transition-colors">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/20">
                <Activity className="size-4 sm:size-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl mb-1">Current Phrase Information</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Phrase {data?.latestPhraseNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Start Epoch</p>
                <p className="text-xl sm:text-3xl">{data?.latestPhraseStartEpoch}</p>
              </div>
              <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">End Epoch</p>
                <p className="text-xl sm:text-3xl">{data?.latestPhraseEndEpoch}</p>
              </div>
              <div className="bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50 col-span-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">Phrase Start Time</p>
                <p className="text-sm sm:text-xl">
                  {formatDateTime(data?.actualPhraseStartTimeForDisplay || null)}
                </p>
              </div>
            </div>
          </div>

          {/* Epoch History Grid */}
          <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/20">
                <Grid3x3 className="size-4 sm:size-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl mb-1">Epoch History Grid</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Color-coded epoch status for current phrase</p>
              </div>
            </div>

            {/* Grid - Square blocks with full epoch numbers */}
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-21 gap-1 mb-6">
              {data?.allEpochsInLatestPhrase?.map((epoch) => (
                <div
                  key={epoch.epochNumber}
                  className={`group relative aspect-square rounded flex items-center justify-center text-[9px] sm:text-[10px] text-white cursor-pointer transition-all hover:scale-110 hover:shadow-lg hover:z-10 ${getEpochStatusColor(epoch.status)} ${epoch.status === 'BERJALAN' ? 'animate-pulse' : ''}`}
                  title={`Epoch ${epoch.epochNumber}: ${epoch.status}`}
                >
                  <span className="opacity-90 font-mono font-medium">
                    {epoch.epochNumber}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-48 sm:w-64 bg-popover border border-border rounded-xl p-3 sm:p-4 shadow-xl text-xs">
                    <p className="font-bold mb-2 text-foreground">Epoch {epoch.epochNumber}</p>
                    <p className="text-muted-foreground mb-1">
                      <strong className="text-foreground">Status:</strong> {epoch.status}
                    </p>
                    <p className="text-muted-foreground mb-1">
                      <strong className="text-foreground">Inactive Time:</strong> {formatDuration(epoch.totalApiHelperInactiveSeconds)}
                    </p>
                    {epoch.lastApiHelperStateChangeTimestamp && (
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Last Change:</strong> {formatDateTime(epoch.lastApiHelperStateChangeTimestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 bg-card/30 rounded-xl p-3 sm:p-4 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">PASS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">FAIL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">RUNNING</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted rounded" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">NO DATA</span>
              </div>
            </div>
          </div>

          {/* Phrase History */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
                  <Clock className="size-4 sm:size-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl mb-1">Phrase History</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Historical performance across all phrases</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-card hover:bg-muted rounded-lg border border-border transition-all text-xs sm:text-sm"
              >
                {historyExpanded ? (
                  <>
                    <span className="hidden sm:inline">Collapse</span>
                    <ChevronUp className="size-4" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Expand</span>
                    <ChevronDown className="size-4" />
                  </>
                )}
              </button>
            </div>

            {historyExpanded && (
              <div className="space-y-3">
                {data?.phraseHistory?.map((phrase) => (
                  <div
                    key={phrase.phraseNumber}
                    className={`p-3 sm:p-4 rounded-xl border transition-colors ${phrase.isCurrentPhrase
                      ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30"
                      : "bg-card/30 border-border/30 hover:border-border/50"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-sm sm:text-lg font-medium">
                          Phrase {phrase.phraseNumber}
                        </span>
                        {phrase.isCurrentPhrase && (
                          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] sm:text-xs rounded-full border border-orange-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          Epochs {phrase.startEpoch} - {phrase.endEpoch}
                        </span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-3 sm:size-4 text-emerald-400" />
                          <span className="text-emerald-400">{phrase.passCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="size-3 sm:size-4 text-destructive" />
                          <span className="text-destructive">{phrase.failCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!historyExpanded && data?.phraseHistory && data.phraseHistory.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {data.phraseHistory.length} phrases available. Click expand to view history.
              </p>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-border/50 text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; 2025 crxanode. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ValidatorDetail;