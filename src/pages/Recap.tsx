import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";


type RecapData = {
  completedCycles: Array<{
    phraseNumber: number;
    week1FullPass: number;
    week2FullPass: number;
    totalValidators: number;
  }>;
  ongoingCycle: {
    phraseNumber: number;
    week1: {
      zeroFails: number;
      withFails: number;
    };
    week2: {
      zeroFails: number;
      withFails: number;
    };
    totalValidators: number;
  } | null;
  constants: any;
  timestamp: string;
};

const Recap = () => {
  const { data, isLoading, error } = useQuery<RecapData>({
    queryKey: ["recap"],
    queryFn: async () => {
      const response = await fetch("/api/recap");
      if (!response.ok) throw new Error("Failed to fetch recap data");
      return response.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading recap data...</p>
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
            <p className="text-red-400">Error loading recap: {(error as Error).message}</p>
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

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl mb-2 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Cycle Recap
            </h1>
            <p className="text-sm text-zinc-400">
              Rekap siklus dengan statistik per minggu
            </p>
          </header>

          {/* Ongoing Cycle */}
          {data?.ongoingCycle && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-lg border border-orange-500/20">
                  <TrendingUp className="size-5 text-orange-400" />
                </div>
                <h2 className="text-2xl">
                  Siklus Saat Ini (Phrase {data.ongoingCycle.phraseNumber})
                </h2>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                <div className="mb-6">
                  <p className="text-sm text-zinc-400">Total Validator</p>
                  <p className="text-3xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                    {data.ongoingCycle.totalValidators}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Week 1 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-blue-400" />
                      <h3 className="text-lg">Minggu 1</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <span className="text-sm text-zinc-400">Tanpa Gagal:</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-4 text-emerald-400" />
                          <span className="text-xl text-emerald-400">
                            {data.ongoingCycle.week1.zeroFails}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <span className="text-sm text-zinc-400">Dengan Gagal:</span>
                        <span className="text-xl text-orange-400">
                          {data.ongoingCycle.week1.withFails}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Week 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-purple-400" />
                      <h3 className="text-lg">Minggu 2</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <span className="text-sm text-zinc-400">Tanpa Gagal:</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-4 text-emerald-400" />
                          <span className="text-xl text-emerald-400">
                            {data.ongoingCycle.week2.zeroFails}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <span className="text-sm text-zinc-400">Dengan Gagal:</span>
                        <span className="text-xl text-orange-400">
                          {data.ongoingCycle.week2.withFails}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Completed Cycles */}
          {data?.completedCycles && data.completedCycles.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg border border-emerald-500/20">
                  <BarChart3 className="size-5 text-emerald-400" />
                </div>
                <h2 className="text-2xl">Siklus Selesai</h2>
              </div>

              <div className="space-y-4">
                {data.completedCycles.map((cycle) => (
                  <div
                    key={cycle.phraseNumber}
                    className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                  >
                    <div className="mb-6">
                      <h3 className="text-xl mb-1">Phrase {cycle.phraseNumber}</h3>
                      <p className="text-sm text-zinc-400">
                        Total: {cycle.totalValidators} validators
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Week 1 Progress */}
                      <div className="p-5 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                        <p className="text-sm text-zinc-400 mb-3">
                          Lulus Penuh Minggu 1 (42 Epoch)
                        </p>
                        <p className="text-3xl mb-3">
                          {cycle.week1FullPass}{" "}
                          <span className="text-lg text-zinc-500">
                            / {cycle.totalValidators}
                          </span>
                        </p>
                        <div className="w-full bg-zinc-700/30 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${(cycle.week1FullPass / cycle.totalValidators) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                          {((cycle.week1FullPass / cycle.totalValidators) * 100).toFixed(1)}% completion rate
                        </p>
                      </div>

                      {/* Week 2 Progress */}
                      <div className="p-5 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                        <p className="text-sm text-zinc-400 mb-3">
                          Lulus Penuh Minggu 2 (42 Epoch)
                        </p>
                        <p className="text-3xl mb-3">
                          {cycle.week2FullPass}{" "}
                          <span className="text-lg text-zinc-500">
                            / {cycle.totalValidators}
                          </span>
                        </p>
                        <div className="w-full bg-zinc-700/30 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${(cycle.week2FullPass / cycle.totalValidators) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                          {((cycle.week2FullPass / cycle.totalValidators) * 100).toFixed(1)}% completion rate
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!data?.ongoingCycle && (!data?.completedCycles || data.completedCycles.length === 0) && (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-12 border border-zinc-800/50 text-center">
              <BarChart3 className="size-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Tidak ada data recap yang tersedia.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-zinc-800/50 text-center text-sm text-zinc-600">
            <p>&copy; 2025 crxanode. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Recap;
