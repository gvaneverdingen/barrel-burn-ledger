import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Database, CheckCircle, AlertCircle, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TestDataCreator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestData = async () => {
    try {
      setLoading(true);
      setResult(null);

      const { data, error } = await supabase.functions.invoke('create-test-data');

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Success!",
        description: "Test data has been created successfully.",
      });
    } catch (error: any) {
      console.error("Error creating test data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-16 border-b flex items-center px-6">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-2xl font-bold">Test Data Creator</h1>
              <p className="text-sm text-muted-foreground">Generate realistic test data for the platform</p>
            </div>
          </header>
          
          <div className="p-6 space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Generate Test Data
                </CardTitle>
                <CardDescription>
                  This will create comprehensive test data including:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Test Distillery:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Highland Heritage Single Malt Distillery</li>
                      <li>• Located in Speyside, Scotland</li>
                      <li>• Established 1876, Verified Distillery</li>
                      <li>• Specializes in premium single malt whisky</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Cask Varieties:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• American Oak Bourbon Barrels</li>
                      <li>• European Oak Sherry Butts</li>
                      <li>• French Oak Cognac Barrels</li>
                      <li>• Port Wine Casks</li>
                      <li>• Japanese Mizunara Oak</li>
                      <li>• Virgin American Oak</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">30 Premium Single Malt Casks:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Highland Heritage Single Malt 12-21 Year aged expressions</li>
                    <li>• Volume range: 190-209 liters per cask</li>
                    <li>• ABV range: 58-62% cask strength</li>
                    <li>• Price range: £76,000 - £220,000 per cask</li>
                    <li>• Realistic tasting notes based on cask type and age</li>
                    <li>• Stored across 3 Highland warehouses</li>
                    <li>• All casks available for purchase with blockchain verification</li>
                  </ul>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will create test data that you can immediately browse in the marketplace, 
                    view individual cask details, and test the purchase flow.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button 
                    onClick={createTestData} 
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    {loading ? "Creating Test Data..." : "Create Test Data"}
                  </Button>
                </div>

                {result && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Test Data Created Successfully!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Badge variant="secondary">Distilleries Created</Badge>
                          <p className="text-2xl font-bold mt-1">{result.distilleries}</p>
                        </div>
                        <div>
                          <Badge variant="secondary">Casks Created</Badge>
                          <p className="text-2xl font-bold mt-1">{result.casks}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Next Steps:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/marketplace'}>
                            Browse Marketplace
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin'}>
                            View Admin Dashboard
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TestDataCreator;