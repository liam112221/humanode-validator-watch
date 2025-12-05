import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";

const DashboardSkeleton = () => {
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
          {/* Header Skeleton */}
          <header className="mb-8 text-center">
            <Skeleton className="h-10 w-[400px] mx-auto mb-2" />
            <Skeleton className="h-4 w-[200px] mx-auto" />
          </header>

          {/* Stats Grid Skeleton */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Validator Table Skeleton */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="mb-6">
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Skeleton className="flex-1 h-10 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="w-16 h-10 rounded-lg" />
                <Skeleton className="w-20 h-10 rounded-lg" />
                <Skeleton className="w-24 h-10 rounded-lg" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="space-y-3">
              {/* Header */}
              <div className="flex gap-4 py-3 border-b border-border">
                <Skeleton className="w-8 h-4" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-24 h-4 hidden sm:block" />
                <Skeleton className="w-32 h-4 hidden md:block" />
              </div>
              {/* Rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4 py-4 border-b border-border/50">
                  <Skeleton className="w-8 h-5" />
                  <Skeleton className="flex-1 h-5" />
                  <Skeleton className="w-20 h-6 rounded-full" />
                  <Skeleton className="w-24 h-5 hidden sm:block" />
                  <Skeleton className="w-32 h-5 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
