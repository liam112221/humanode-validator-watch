import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import RecapSkeleton from "@/components/skeletons/RecapSkeleton";


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
    return <RecapSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="bg-card rounded-2xl p-6 border-2 border-destructive shadow-paper">
            <p className="text-destructive font-handwritten text-lg">Error loading recap: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-handwritten text-foreground mb-2">
            Cycle Recap
          </h1>
          <p className="text-sm text-muted-foreground">
            Rekap siklus dengan statistik per minggu
          </p>
        </header>

        {/* Ongoing Cycle */}
        {data?.ongoingCycle && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent rounded-xl border-2 border-border">
                <TrendingUp className="size-5 text-foreground" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-handwritten">
                Siklus Saat Ini (Phrase {data.ongoingCycle.phraseNumber})
              </h2>
            </div>

            <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Total Validator</p>
                <p className="text-3xl sm:text-4xl font-handwritten text-primary">
                  {data.ongoingCycle.totalValidators}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Week 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-chart-3" />
                    <h3 className="text-xl font-handwritten">Minggu 1</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-background rounded-xl border-2 border-border">
                      <span className="text-xs sm:text-sm text-muted-foreground">Tanpa Gagal:</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-success" />
                        <span className="text-xl sm:text-2xl font-handwritten text-success">
                          {data.ongoingCycle.week1.zeroFails}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-background rounded-xl border-2 border-border">
                      <span className="text-xs sm:text-sm text-muted-foreground">Dengan Gagal:</span>
                      <span className="text-xl sm:text-2xl font-handwritten text-primary">
                        {data.ongoingCycle.week1.withFails}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Week 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-chart-4" />
                    <h3 className="text-xl font-handwritten">Minggu 2</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-background rounded-xl border-2 border-border">
                      <span className="text-xs sm:text-sm text-muted-foreground">Tanpa Gagal:</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-success" />
                        <span className="text-xl sm:text-2xl font-handwritten text-success">
                          {data.ongoingCycle.week2.zeroFails}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-background rounded-xl border-2 border-border">
                      <span className="text-xs sm:text-sm text-muted-foreground">Dengan Gagal:</span>
                      <span className="text-xl sm:text-2xl font-handwritten text-primary">
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
              <div className="p-2 bg-success/20 rounded-xl border-2 border-success/30">
                <BarChart3 className="size-5 text-success" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-handwritten">Siklus Selesai</h2>
            </div>

            <div className="space-y-4">
              {data.completedCycles.map((cycle) => (
                <div
                  key={cycle.phraseNumber}
                  className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border shadow-paper hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-handwritten mb-1">Phrase {cycle.phraseNumber}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total: {cycle.totalValidators} validators
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Week 1 Progress */}
                    <div className="p-4 sm:p-5 bg-background rounded-xl border-2 border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        Lulus Penuh Minggu 1 (42 Epoch)
                      </p>
                      <p className="text-2xl sm:text-3xl font-handwritten mb-3">
                        {cycle.week1FullPass}{" "}
                        <span className="text-base sm:text-lg text-muted-foreground">
                          / {cycle.totalValidators}
                        </span>
                      </p>
                      <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden border border-border">
                        <div
                          className="bg-success h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(cycle.week1FullPass / cycle.totalValidators) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        {((cycle.week1FullPass / cycle.totalValidators) * 100).toFixed(1)}% completion rate
                      </p>
                    </div>

                    {/* Week 2 Progress */}
                    <div className="p-4 sm:p-5 bg-background rounded-xl border-2 border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        Lulus Penuh Minggu 2 (42 Epoch)
                      </p>
                      <p className="text-2xl sm:text-3xl font-handwritten mb-3">
                        {cycle.week2FullPass}{" "}
                        <span className="text-base sm:text-lg text-muted-foreground">
                          / {cycle.totalValidators}
                        </span>
                      </p>
                      <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden border border-border">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(cycle.week2FullPass / cycle.totalValidators) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
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
          <div className="bg-card rounded-2xl p-12 border-2 border-border shadow-paper text-center">
            <BarChart3 className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-handwritten text-lg">Tidak ada data recap yang tersedia.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t-2 border-border border-dashed text-center text-sm text-muted-foreground">
          <p className="font-handwritten">&copy; 2025 crxanode. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Recap;
