import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";

const RecapSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          {/* Header Skeleton */}
          <header className="mb-8 text-center">
            <Skeleton className="h-10 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </header>

          {/* Ongoing Cycle Skeleton */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-7 w-64" />
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
              <div className="mb-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-9 w-16" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[...Array(2)].map((_, weekIdx) => (
                  <div key={weekIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="space-y-2">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-3 sm:p-4 bg-card/50 rounded-xl border border-border/50">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Completed Cycles Skeleton */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-7 w-40" />
            </div>

            <div className="space-y-4">
              {[...Array(2)].map((_, cycleIdx) => (
                <div key={cycleIdx} className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
                  <div className="mb-4 sm:mb-6">
                    <Skeleton className="h-6 w-28 mb-2" />
                    <Skeleton className="h-4 w-36" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="p-4 sm:p-5 bg-card/30 rounded-xl border border-border/30">
                        <Skeleton className="h-4 w-40 mb-3" />
                        <Skeleton className="h-9 w-24 mb-3" />
                        <Skeleton className="h-2 sm:h-3 w-full rounded-full mb-2" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RecapSkeleton;
