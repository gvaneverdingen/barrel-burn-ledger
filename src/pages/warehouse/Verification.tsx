import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const WarehouseVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: warehouse } = useQuery({
    queryKey: ["warehouse", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("warehouses").select("*").eq("profile_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!warehouse) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">No Application Found</h1>
        <Button onClick={() => navigate("/warehouse/onboarding")}>Apply Now</Button>
      </div>
    );
  }

  const status = warehouse.verified
    ? { label: "Verified", icon: CheckCircle, color: "bg-green-500" }
    : warehouse.bonded_warehouse_number
    ? { label: "Pending Review", icon: Clock, color: "bg-amber-500" }
    : { label: "Incomplete", icon: AlertCircle, color: "bg-destructive" };

  const Icon = status.icon;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 luxury-text-gradient">Warehouse Verification</h1>

      <Card className="luxury-card mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{warehouse.name}</CardTitle>
            <CardDescription>{warehouse.location}{warehouse.country ? `, ${warehouse.country}` : ""}</CardDescription>
          </div>
          <Badge className={status.color}><Icon className="h-4 w-4 mr-1" />{status.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-muted-foreground">Bonded WH Number:</span> <code className="bg-muted px-2 py-0.5 rounded">{warehouse.bonded_warehouse_number || "—"}</code></div>
            <div><span className="text-muted-foreground">Excise Authority:</span> {warehouse.excise_authority || "—"}</div>
            <div><span className="text-muted-foreground">Keeper Licence:</span> {warehouse.warehouse_keeper_license || "—"}</div>
            <div><span className="text-muted-foreground">Capacity:</span> {warehouse.capacity_casks ?? "—"} casks</div>
          </div>
        </CardContent>
      </Card>

      {!warehouse.verified && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review in progress</CardTitle>
            <CardDescription>
              Our team is reviewing your bonded warehouse credentials. You'll receive a notification when verified.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default WarehouseVerification;