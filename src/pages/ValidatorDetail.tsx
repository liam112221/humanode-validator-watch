import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle, Clock, Grid3x3, TrendingUp, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
        return "bg-emerald-500";
      case "FAIL_API_HELPER":
        return "bg-red-500";
      case "BERJALAN":
        return "bg-gradient-to-r from-orange-500 to-pink-500";
      case "NO_DATA":
        return "bg-zinc-800";
      default:
        return "bg-zinc-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading validator data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || data?.errorMessage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Ambient Gradient Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-red-500/20 via-orange-500/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8">
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                <AlertCircle className="size-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl mb-2">Error Loading Validator</h3>
                <p className="text-red-400">
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-zinc-800/50 backdrop-blur-sm">
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
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-all text-sm"
                >
                  Dashboard
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-lg transition-all text-sm">
                  Recap
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          {/* Network Epoch Progress */}
          {networkStatus?.webServerEpochProgress && (
            <div className="mb-6 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-xl border border-orange-500/20">
                    <TrendingUp className="size-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl mb-1">Current Network Epoch Progress</h2>
                    <p className="text-sm text-zinc-400">
                      Epoch {networkStatus.webServerEpochProgress.currentEpochSystem}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full relative transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, networkStatus.webServerEpochProgress.percentageCompleted)).toFixed(2)}%`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 animate-pulse opacity-50" />
                  </div>
                </div>
                <p className="text-sm mt-3 text-zinc-400">
                  {networkStatus.webServerEpochProgress.percentageCompleted.toFixed(2)}% completed • {networkStatus.webServerEpochProgress.currentBlockInEpoch.toLocaleString()} of {networkStatus.webServerEpochProgress.blocksInEpoch.toLocaleString()} blocks
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-2">Blocks in Epoch</p>
                  <p className="text-2xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                    {networkStatus.webServerEpochProgress.currentBlockInEpoch.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-600">
                    of {networkStatus.webServerEpochProgress.blocksInEpoch.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-2">Remaining Blocks</p>
                  <p className="text-2xl">
                    {networkStatus.webServerEpochProgress.remainingBlocksInEpoch.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-2">Est. Next Epoch In</p>
                  <p className="text-2xl">
                    {formatDuration(networkStatus.webServerEpochProgress.nextEpochETASec)}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 md:col-span-2">
                  <p className="text-xs text-zinc-500 mb-2">Est. Epoch Completion Time</p>
                  <p className="text-lg">
                    {formatDateTime(networkStatus.webServerEpochProgress.estimatedEpochCompletionTime)}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-2">Current Network Block</p>
                  <p className="text-2xl">
                    {networkStatus.webServerEpochProgress.currentAbsoluteBlock.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validator Detail Header */}
          <div className="mb-6">
            <h2 className="text-lg mb-3 text-zinc-400">Validator Detail</h2>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 inline-block">
              <code className="text-xs text-orange-400 font-mono break-all">
                {data?.validatorAddress}
              </code>
            </div>
          </div>

          {/* Current Phrase Info */}
          <div className="mb-6 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/20">
                <Activity className="size-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Current Phrase Information</h3>
                <p className="text-sm text-zinc-400">Phrase {data?.latestPhraseNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <p className="text-xs text-zinc-500 mb-2">Start Epoch</p>
                <p className="text-3xl">{data?.latestPhraseStartEpoch}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <p className="text-xs text-zinc-500 mb-2">End Epoch</p>
                <p className="text-3xl">{data?.latestPhraseEndEpoch}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 md:col-span-2">
                <p className="text-xs text-zinc-500 mb-2">Phrase Start Time</p>
                <p className="text-xl">
                  {formatDateTime(data?.actualPhraseStartTimeForDisplay || null)}
                </p>
              </div>
            </div>
          </div>

          {/* Epoch History Grid */}
          <div className="mb-6 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/20">
                <Grid3x3 className="size-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl mb-1">Epoch History Grid</h3>
                <p className="text-sm text-zinc-400">Color-coded epoch status for current phrase</p>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 lg:grid-cols-21 gap-2 mb-6">
              {data?.allEpochsInLatestPhrase?.map((epoch) => (
                <div
                  key={epoch.epochNumber}
                  className={`group relative w-10 h-10 rounded-lg flex items-center justify-center text-xs text-white cursor-pointer transition-all hover:scale-110 hover:shadow-lg ${getEpochStatusColor(epoch.status)} ${epoch.status === 'BERJALAN' ? 'animate-pulse' : ''
                    }`}
                  title={`Epoch ${epoch.epochNumber}: ${epoch.status}`}
                >
                  <span className="opacity-80 font-mono">
                    {epoch.epochNumber % 10}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-xl text-xs">
                    <p className="font-bold mb-2 text-white">Epoch {epoch.epochNumber}</p>
                    <p className="text-zinc-400 mb-1">
                      <strong className="text-white">Status:</strong> {epoch.status}
                    </p>
                    <p className="text-zinc-400 mb-1">
                      <strong className="text-white">Inactive Time:</strong> {formatDuration(epoch.totalApiHelperInactiveSeconds)}
                    </p>
                    {epoch.lastApiHelperStateChangeTimestamp && (
                      <p className="text-zinc-400">
                        <strong className="text-white">Last Change:</strong> {formatDateTime(epoch.lastApiHelperStateChangeTimestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-xs text-zinc-400">PASS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-xs text-zinc-400">FAIL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded" />
                <span className="text-xs text-zinc-400">RUNNING</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-800 rounded" />
                <span className="text-xs text-zinc-400">NO DATA</span>
              </div>
            </div>
          </div>

          {/* Phrase History */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
                  <Clock className="size-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl mb-1">Phrase History</h3>
                  <p className="text-sm text-zinc-400">Historical performance across all phrases</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-all text-sm"
              >
                {historyExpanded ? (
                  <>
                    Collapse
                    <ChevronUp className="size-4" />
                  </>
                ) : (
                  <>
                    Expand
                    <ChevronDown className="size-4" />
                  </>
                )}
              </button>
            </div>

            {/* Phrase Cards */}
            {historyExpanded && (
              <div className="space-y-3">
                {data?.phraseHistory?.map((phrase) => (
                  <div
                    key={phrase.phraseNumber}
                    className={`rounded-xl p-5 border transition-all ${phrase.isCurrentPhrase
                      ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10'
                      : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600/50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          Phrase {phrase.phraseNumber}
                        </span>
                        {phrase.isCurrentPhrase && (
                          <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Epochs {phrase.startEpoch} - {phrase.endEpoch}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <CheckCircle className="size-4 text-emerald-400" />
                          <span className="text-2xl">{phrase.passCount}</span>
                        </div>
                        <p className="text-xs text-zinc-500">PASS</p>
                      </div>
                      <div className="text-center bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <AlertCircle className="size-4 text-red-400" />
                          <span className="text-2xl">{phrase.failCount}</span>
                        </div>
                        <p className="text-xs text-zinc-500">FAIL</p>
                      </div>
                      <div className="text-center bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Activity className="size-4 text-zinc-400" />
                          <span className="text-2xl">{phrase.otherCount}</span>
                        </div>
                        <p className="text-xs text-zinc-500">OTHER</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-zinc-800/50 text-center text-sm text-zinc-600">
            <p>&copy; 2025 crxanode. All rights reserved.</p>
            <p className="mt-2 text-xs">Last updated: {new Date().toLocaleString()}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ValidatorDetail;
