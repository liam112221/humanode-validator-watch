import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";

const ValidatorDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Back Button */}
          <Skeleton className="w-32 h-5 mb-6" />

          {/* Network Epoch Progress Skeleton */}
          <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-56 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Skeleton className="h-2 w-full rounded-full mb-3" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50 ${i >= 3 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-7 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Validator Address */}
          <div className="mb-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-12 w-full max-w-md rounded-xl" />
          </div>

          {/* Current Phrase Info Skeleton */}
          <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`bg-card/50 rounded-xl p-3 sm:p-4 border border-border/50 ${i === 2 ? 'col-span-2' : ''}`}>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Epoch Grid Skeleton */}
          <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-21 gap-1 mb-6">
              {[...Array(84)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded" />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 bg-card/30 rounded-xl p-3 sm:p-4 border border-border/30">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="w-12 h-3" />
                </div>
              ))}
            </div>
          </div>

          {/* Phrase History Skeleton */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card/50 rounded-xl p-4 border border-border/50">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatorDetailSkeleton;
