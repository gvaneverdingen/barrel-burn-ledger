import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Droplets, Gauge, DollarSign, Wine, Building, Hash, Shield } from "lucide-react";

interface CaskDetails {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  current_volume_liters: number;
  alcohol_percentage: number;
  price_per_liter: number;
  total_price: number;
  available_for_sale: boolean;
  warehouse_location: string;
  tasting_notes: string;
  blockchain_id: string;
  blockchain_hash: string;
  expected_maturation_years: number;
  created_at: string;
  distillery: {
    id: string;
    name: string;
    location: string;
    description: string;
    established_year: number;
    verified: boolean;
  };
  cask_type: {
    id: string;
    name: string;
    capacity_liters: number;
    description: string;
  };
}

const CaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cask, setCask] = useState<CaskDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (id) {
      fetchCaskDetails(id);
    }
  }, [id, user, navigate]);

  const fetchCaskDetails = async (caskId: string) => {
    try {
      const { data, error } = await supabase
        .from("casks")
        .select(`
          *,
          distillery:distilleries(
            id,
            name,
            location,
            description,
            established_year,
            verified
          ),
          cask_type:cask_types(
            id,
            name,
            capacity_liters,
            description
          )
        `)
        .eq("id", caskId)
        .eq("available_for_sale", true)
        .single();

      if (error) throw error;

      setCask(data as CaskDetails);
    } catch (error: any) {
      console.error("Error fetching cask details:", error);
      toast({
        title: "Error",
        description: "Failed to load cask details. Please try again.",
        variant: "destructive",
      });
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (distillationDate: string) => {
    const now = new Date();
    const distilled = new Date(distillationDate);
    return Math.floor((now.getTime() - distilled.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePurchaseInquiry = () => {
    toast({
      title: "Purchase Inquiry Sent",
      description: "We'll contact you shortly with purchase details.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
          <Card>
            <CardContent className="text-center py-12">
              <h4 className="text-lg font-medium mb-2">Cask not found</h4>
              <p className="text-muted-foreground">The requested cask could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold text-primary">
                      {cask.spirit_name}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>{cask.distillery.name}</span>
                      {cask.distillery.verified && (
                        <Shield className="h-4 w-4 text-green-600" />
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      #{cask.cask_number}
                    </Badge>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(cask.total_price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(cask.price_per_liter)}/L
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-semibold">{calculateAge(cask.distillation_date)} years</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Droplets className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Volume</p>
                      <p className="font-semibold">{cask.current_volume_liters}L</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Gauge className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">ABV</p>
                      <p className="font-semibold">{cask.alcohol_percentage}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Wine className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cask Type</p>
                      <p className="font-semibold">{cask.cask_type.name}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cask Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Distillation Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distillation Date:</span>
                        <span>{formatDate(cask.distillation_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Maturation:</span>
                        <span>{cask.expected_maturation_years} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Warehouse Location:</span>
                        <span>{cask.warehouse_location || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cask Specifications</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cask Capacity:</span>
                        <span>{cask.cask_type.capacity_liters}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Volume:</span>
                        <span>{cask.current_volume_liters}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fill Level:</span>
                        <span>{Math.round((cask.current_volume_liters / cask.cask_type.capacity_liters) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {cask.tasting_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Tasting Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cask.tasting_notes}
                    </p>
                  </div>
                )}

                {cask.cask_type.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Cask Type Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cask.cask_type.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5" />
                  <span>Blockchain Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Blockchain ID</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{cask.blockchain_id}</p>
                  </div>
                  {cask.blockchain_hash && (
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono text-sm bg-muted p-2 rounded break-all">{cask.blockchain_hash}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Investment Opportunity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(cask.total_price)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price per Liter:</span>
                    <span className="font-medium">{formatCurrency(cask.price_per_liter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span className="font-medium">{cask.current_volume_liters}L</span>
                  </div>
                </div>

                {userRole !== "distillery" && (
                  <Button 
                    className="w-full" 
                    onClick={handlePurchaseInquiry}
                    size="lg"
                  >
                    Inquire About Purchase
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/marketplace">Browse More Casks</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Distillery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Distillery</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{cask.distillery.name}</h3>
                  {cask.distillery.verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{cask.distillery.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Established:</span>
                    <span>{cask.distillery.established_year}</span>
                  </div>
                </div>

                {cask.distillery.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cask.distillery.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaskDetails;