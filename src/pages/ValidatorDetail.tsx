import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Validator Detail Page
 * Shows detailed information about a specific validator
 */
const ValidatorDetail = () => {
  const { address } = useParams();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Validator Detail
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {address || "No address provided"}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Epoch History</CardTitle>
            <CardDescription>
              Detail history epoch untuk validator ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Placeholder untuk detail validator
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

export default ValidatorDetail;
