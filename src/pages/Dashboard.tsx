import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard Page
 * Displays list of all validators with their current status
 */
const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Humanode Validator Monitor
          </h1>
          <p className="text-muted-foreground">
            Dashboard monitoring untuk semua validator
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Validator List</CardTitle>
            <CardDescription>
              Data validator akan ditampilkan di sini setelah logic diintegrasikan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Placeholder untuk tabel validator
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                UI akan di-generate setelah logic dari server.js diintegrasikan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
