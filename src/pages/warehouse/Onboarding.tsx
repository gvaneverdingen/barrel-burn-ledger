import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, CheckCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const COUNTRY_BOND_INFO: Record<string, { authority: string; placeholder: string; help: string }> = {
  Scotland: { authority: "HMRC", placeholder: "e.g. GB00000123456", help: "HMRC Excise Warehouse Approval number under the CEMA 1979 Excise Warehousing (Etc.) Regulations." },
  UK: { authority: "HMRC", placeholder: "e.g. GB00000123456", help: "HMRC Excise Warehouse Approval number." },
  France: { authority: "DGDDI (Douanes)", placeholder: "e.g. FR00000123456", help: "Numéro d'agrément d'entrepôt fiscal délivré par la DGDDI." },
  Ireland: { authority: "Revenue Commissioners", placeholder: "e.g. IE00000123456", help: "Tax Warehouse approval number issued by the Office of the Revenue Commissioners." },
  USA: { authority: "TTB", placeholder: "e.g. BW-KY-12345", help: "Bonded Warehouse permit issued by the Alcohol and Tobacco Tax and Trade Bureau." },
  Germany: { authority: "Hauptzollamt", placeholder: "e.g. DE00000000000", help: "Steuerlagernummer für ein Steuerlager." },
  Netherlands: { authority: "Douane", placeholder: "e.g. NL/AGP/1234567", help: "AGP-vergunning voor een accijnsgoederenplaats." },
  Spain: { authority: "AEAT", placeholder: "e.g. ES00012345AB", help: "CAE para depósito fiscal." },
  Italy: { authority: "Agenzia Dogane", placeholder: "e.g. IT00IT00012345A", help: "Codice accisa per deposito fiscale." },
  Other: { authority: "Customs / Excise authority", placeholder: "Bonded warehouse number", help: "Bonded warehouse approval number issued by the customs/excise authority in your jurisdiction." },
};

const WarehouseOnboarding = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    country: "",
    description: "",
    established_year: "",
    bonded_warehouse_number: "",
    customs_jurisdiction: "",
    warehouse_keeper_license: "",
    excise_authority: "",
    capacity_casks: "",
    website: "",
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["warehouse-application", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const bondInfo = COUNTRY_BOND_INFO[formData.country] || COUNTRY_BOND_INFO.Other;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in to apply");
    if (!formData.name || !formData.location || !formData.country || !formData.bonded_warehouse_number) {
      return toast.error("Please fill in all required fields");
    }

    setIsSubmitting(true);
    try {
      const { data: warehouse, error } = await supabase
        .from("warehouses")
        .insert({
          profile_id: user.id,
          name: formData.name,
          location: formData.location,
          country: formData.country,
          description: formData.description || null,
          established_year: formData.established_year ? parseInt(formData.established_year) : null,
          bonded_warehouse_number: formData.bonded_warehouse_number,
          customs_jurisdiction: formData.customs_jurisdiction || formData.country,
          warehouse_keeper_license: formData.warehouse_keeper_license || null,
          excise_authority: formData.excise_authority || bondInfo.authority,
          capacity_casks: formData.capacity_casks ? parseInt(formData.capacity_casks) : null,
          website: formData.website || null,
          verified: false,
        })
        .select()
        .single();

      if (error) throw error;

      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "administrator");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.user_id,
            type: "warehouse_application",
            title: "New Warehouse Application",
            message: `${formData.name} has applied for bonded warehouse verification.`,
            link: "/admin/dashboard",
            metadata: { warehouse_id: warehouse.id },
          })),
        );
      }

      toast.success("Application submitted! We'll review it shortly.");
      navigate("/warehouse/verification");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <SignInPrompt title="Sign in to apply" description="Sign in to submit a bonded warehouse application." />;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (existing) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold mb-2">Application Already Submitted</h1>
        <p className="text-muted-foreground mb-6">
          Your application for <strong>{existing.name}</strong> {existing.verified ? "has been verified." : "is pending review."}
        </p>
        <Button onClick={() => navigate("/warehouse")}>Go to Warehouse Dashboard</Button>
      </div>
    );
  }

  if (userRole === "consumer") {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">Warehouse Applications Not Available</h1>
        <p className="text-muted-foreground mb-6">
          Consumer accounts cannot apply to become a bonded warehouse. This is reserved for licensed warehouse keepers.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
          <Button onClick={() => navigate("/help")}>Contact Partnerships</Button>
        </div>
      </div>
    );
  }

  if (userRole === "facilitator") {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <Warehouse className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">You're Already a Warehouse Partner</h1>
        <Button onClick={() => navigate("/warehouse")}>Go to Warehouse Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Warehouse className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold luxury-text-gradient">Become a Bonded Warehouse Partner</h1>
          <p className="text-muted-foreground mt-2">
            Independent warehousing for cask holders — list casks held under bond on the marketplace.
          </p>
        </div>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle>Bonded Warehouse Application</CardTitle>
            <CardDescription>Verification typically takes 2–3 business days.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Warehouse Name *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Speyside Bonded Stores Ltd" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Dufftown, Moray" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Jurisdiction *</Label>
                  <Select value={formData.country} onValueChange={(v) => setFormData((p) => ({ ...p, country: v, bonded_warehouse_number: "", excise_authority: "" }))}>
                    <SelectTrigger id="country"><SelectValue placeholder="Select jurisdiction" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scotland">Scotland</SelectItem>
                      <SelectItem value="UK">United Kingdom (England / Wales / NI)</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Netherlands">Netherlands</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                      <SelectItem value="Italy">Italy</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excise_authority">Customs / Excise Authority</Label>
                  <Input id="excise_authority" name="excise_authority" value={formData.excise_authority} onChange={handleChange} placeholder={bondInfo.authority} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bonded_warehouse_number">Bonded Warehouse Number *</Label>
                  <Input
                    id="bonded_warehouse_number"
                    name="bonded_warehouse_number"
                    value={formData.bonded_warehouse_number}
                    onChange={handleChange}
                    placeholder={bondInfo.placeholder}
                    required
                    disabled={!formData.country}
                  />
                  <p className="text-xs text-muted-foreground">{formData.country ? bondInfo.help : "Select your jurisdiction first."}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="warehouse_keeper_license">Warehouse Keeper Licence</Label>
                  <Input id="warehouse_keeper_license" name="warehouse_keeper_license" value={formData.warehouse_keeper_license} onChange={handleChange} placeholder="Authorised Warehouse Keeper / Entrepositaire Agréé reference" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity_casks">Capacity (casks)</Label>
                  <Input id="capacity_casks" name="capacity_casks" type="number" min="0" value={formData.capacity_casks} onChange={handleChange} placeholder="e.g., 5000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="established_year">Year Established</Label>
                  <Input id="established_year" name="established_year" type="number" min="1700" max={new Date().getFullYear()} value={formData.established_year} onChange={handleChange} placeholder="e.g., 1972" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" value={formData.website} onChange={handleChange} placeholder="www.warehouse.com" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">About Your Warehouse</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Tell us about your facility, the spirits stored, and the regions you serve." />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Our team reviews your bonded warehouse credentials</li>
                  <li>• We may request supporting documentation</li>
                  <li>• Once approved, you'll receive the Facilitator role and can list casks</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="luxury-button">
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WarehouseOnboarding;