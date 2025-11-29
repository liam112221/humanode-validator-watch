import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Recap Page
 * Shows cycle recap with statistics per week
 */
const Recap = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Cycle Recap
          </h1>
          <p className="text-muted-foreground">
            Rekap siklus dengan statistik per minggu
          </p>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Siklus Saat Ini</CardTitle>
              <CardDescription>
                Phrase yang sedang berjalan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Placeholder untuk recap siklus aktif
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  UI akan di-generate setelah logic dari server.js diintegrasikan
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Siklus Selesai</CardTitle>
              <CardDescription>
                History phrase yang sudah selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Placeholder untuk recap siklus selesai
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Recap;
