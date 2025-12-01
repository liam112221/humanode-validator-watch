import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading recap data...</p>
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
              <p className="text-destructive">Error loading recap: {(error as Error).message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Cycle Recap
          </h1>
          <p className="text-sm text-muted-foreground">
            Rekap siklus dengan statistik per minggu
          </p>
        </header>

        {data?.ongoingCycle && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Siklus Saat Ini (Phrase {data.ongoingCycle.phraseNumber})
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Total Validator: {data.ongoingCycle.totalValidators}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Minggu 1</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">Tanpa Gagal:</span>
                        <span className="text-lg font-bold text-green-600">
                          {data.ongoingCycle.week1.zeroFails} validator
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">Dengan Gagal:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {data.ongoingCycle.week1.withFails} validator
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Minggu 2</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">Tanpa Gagal:</span>
                        <span className="text-lg font-bold text-green-600">
                          {data.ongoingCycle.week2.zeroFails} validator
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">Dengan Gagal:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {data.ongoingCycle.week2.withFails} validator
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {data?.completedCycles && data.completedCycles.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Siklus Selesai
            </h2>
            <div className="space-y-4">
              {data.completedCycles.map((cycle) => (
                <Card key={cycle.phraseNumber}>
                  <CardHeader>
                    <CardTitle>Phrase {cycle.phraseNumber}</CardTitle>
                    <CardDescription>
                      Total: {cycle.totalValidators} validators
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground mb-2">
                          Lulus Penuh Minggu 1 (42 Epoch)
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {cycle.week1FullPass}{" "}
                          <span className="text-sm text-muted-foreground">
                            / {cycle.totalValidators}
                          </span>
                        </p>
                        <div className="mt-2 w-full bg-muted-foreground/20 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(cycle.week1FullPass / cycle.totalValidators) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground mb-2">
                          Lulus Penuh Minggu 2 (42 Epoch)
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {cycle.week2FullPass}{" "}
                          <span className="text-sm text-muted-foreground">
                            / {cycle.totalValidators}
                          </span>
                        </p>
                        <div className="mt-2 w-full bg-muted-foreground/20 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(cycle.week2FullPass / cycle.totalValidators) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {!data?.ongoingCycle && (!data?.completedCycles || data.completedCycles.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Tidak ada data recap yang tersedia.</p>
            </CardContent>
          </Card>
        )}

        <footer className="text-center py-8 mt-8">
          <p className="text-sm text-muted-foreground">&copy; 2025 crxanode. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Recap;
