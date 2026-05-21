import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Wine } from "lucide-react";
import CaskAdvancedSpecsFields, {
  AdvancedSpecsState,
  emptyAdvancedSpecs,
  buildAdvancedSpecsPayload,
} from "@/components/CaskAdvancedSpecsFields";

const WarehouseNewCask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedSpecs, setAdvancedSpecs] = useState<AdvancedSpecsState>(emptyAdvancedSpecs);

  const [formData, setFormData] = useState({
    cask_number: "",
    spirit_name: "",
    distillation_date: "",
    cask_type_id: "",
    current_volume_liters: "",
    alcohol_percentage: "",
    price_per_liter: "",
    warehouse_location: "",
    region: "",
    tasting_notes: "",
    quality_grade: "",
    expected_maturation_years: "",
    available_for_sale: false,
    last_gauging_date: "",
  });

  const { data: warehouse, isLoading: whLoading } = useQuery({
    queryKey: ["warehouse", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("*").eq("profile_id", user?.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: caskTypes } = useQuery({
    queryKey: ["cask-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cask_types").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse) {
      toast.error("Complete warehouse onboarding first");
      return navigate("/warehouse/onboarding");
    }
    if (!formData.cask_number || !formData.spirit_name || !formData.distillation_date || !formData.cask_type_id) {
      return toast.error("Please fill in all required fields");
    }
    setIsSubmitting(true);
    try {
      const blockchainId = `CASK-WH-${warehouse.id.slice(0, 8)}-${Date.now()}`;
      const currentVolume = parseFloat(formData.current_volume_liters) || null;
      const pricePerLiter = parseFloat(formData.price_per_liter) || null;
      const totalPrice = currentVolume && pricePerLiter ? currentVolume * pricePerLiter : null;

      const { data, error } = await supabase
        .from("casks")
        .insert({
          cask_number: formData.cask_number,
          spirit_name: formData.spirit_name,
          distillation_date: formData.distillation_date,
          cask_type_id: formData.cask_type_id,
          warehouse_id: warehouse.id,
          distillery_id: null,
          blockchain_id: blockchainId,
          current_volume_liters: currentVolume,
          alcohol_percentage: parseFloat(formData.alcohol_percentage) || null,
          price_per_liter: pricePerLiter,
          total_price: totalPrice,
          warehouse_location: formData.warehouse_location || null,
          region: formData.region || null,
          tasting_notes: formData.tasting_notes || null,
          quality_grade: formData.quality_grade || null,
          expected_maturation_years: parseInt(formData.expected_maturation_years) || null,
          available_for_sale: formData.available_for_sale,
          last_gauging_date: formData.last_gauging_date || null,
          wowgr_holder_warehouse_id: warehouse.id,
          ...buildAdvancedSpecsPayload(advancedSpecs),
        })
        .select()
        .single();

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["warehouse-casks"] });
      toast.success("Cask created! Minting NFT...");

      try {
        const { data: mint, error: mintErr } = await supabase.functions.invoke("mint-cask-nft", { body: { caskId: data.id } });
        if (mintErr || !mint?.success) {
          toast.error("Cask created but NFT minting failed. You can retry later.");
        } else {
          toast.success(`NFT minted! Token #${mint.tokenId}.`);
        }
      } catch {
        toast.error("Cask created but NFT minting failed.");
      }
      navigate("/warehouse");
    } catch (err: any) {
      toast.error(err.message || "Failed to create cask");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (whLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!warehouse) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md text-center">
        <Card>
          <CardHeader>
            <CardTitle>No Warehouse Found</CardTitle>
            <CardDescription>Complete onboarding first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/warehouse/onboarding")} className="w-full">Start Onboarding</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate("/warehouse")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wine className="h-6 w-6" />Add New Cask</CardTitle>
          <CardDescription>Register a cask held under bond at {warehouse.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cask Number *</Label><Input name="cask_number" value={formData.cask_number} onChange={onChange} required /></div>
              <div className="space-y-2"><Label>Spirit Name *</Label><Input name="spirit_name" value={formData.spirit_name} onChange={onChange} required /></div>
              <div className="space-y-2"><Label>Distillation Date *</Label><Input name="distillation_date" type="date" value={formData.distillation_date} onChange={onChange} required /></div>
              <div className="space-y-2">
                <Label>Cask Type *</Label>
                <Select value={formData.cask_type_id} onValueChange={(v) => setFormData((p) => ({ ...p, cask_type_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select cask type" /></SelectTrigger>
                  <SelectContent>
                    {caskTypes?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.capacity_liters}L)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Current Volume (L)</Label><Input name="current_volume_liters" type="number" step="0.01" value={formData.current_volume_liters} onChange={onChange} /></div>
              <div className="space-y-2"><Label>ABV (%)</Label><Input name="alcohol_percentage" type="number" step="0.1" value={formData.alcohol_percentage} onChange={onChange} /></div>
              <div className="space-y-2"><Label>Price per Liter</Label><Input name="price_per_liter" type="number" step="0.01" value={formData.price_per_liter} onChange={onChange} /></div>
              <div className="space-y-2"><Label>Last Gauging Date</Label><Input name="last_gauging_date" type="date" value={formData.last_gauging_date} onChange={onChange} max={new Date().toISOString().split("T")[0]} /></div>
              <div className="space-y-2"><Label>Warehouse Location</Label><Input name="warehouse_location" value={formData.warehouse_location} onChange={onChange} placeholder="e.g., Bay 12, Rack 4" /></div>
              <div className="space-y-2"><Label>Region</Label><Input name="region" value={formData.region} onChange={onChange} placeholder="e.g., Cognac, France" /></div>
              <div className="space-y-2">
                <Label>Quality Grade</Label>
                <Select value={formData.quality_grade} onValueChange={(v) => setFormData((p) => ({ ...p, quality_grade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Exceptional">Exceptional</SelectItem>
                    <SelectItem value="Rare">Rare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Expected Maturation (Years)</Label><Input name="expected_maturation_years" type="number" value={formData.expected_maturation_years} onChange={onChange} /></div>
            </div>

            <div className="space-y-2">
              <Label>Tasting Notes</Label>
              <Textarea name="tasting_notes" value={formData.tasting_notes} onChange={onChange} rows={4} />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-base font-medium">Available for Sale</Label>
                <p className="text-sm text-muted-foreground">Make this cask visible in the marketplace</p>
              </div>
              <Switch checked={formData.available_for_sale} onCheckedChange={(c) => setFormData((p) => ({ ...p, available_for_sale: c }))} />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/warehouse")} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 luxury-button">
                {isSubmitting ? "Creating..." : <><Save className="h-4 w-4 mr-2" />Create Cask</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseNewCask;