import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const DistilleryOnboarding = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    established_year: "",
    license_number: "",
    website: "",
    country: "",
  });

  // Check if user already has a distillery application
  const { data: existingDistillery, isLoading } = useQuery({
    queryKey: ['distillery-application', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  const LICENSE_BY_COUNTRY: Record<string, { label: string; placeholder: string; help: string }> = {
    UK: { label: "HMRC AWRS Number", placeholder: "e.g. XYAW00000123456", help: "Alcohol Wholesaler Registration Scheme number issued by HMRC, plus your Distiller's Licence under the Alcoholic Liquor Duties Act 1979." },
    Scotland: { label: "HMRC AWRS + SWA Producer Reference", placeholder: "e.g. XYAW00000123456 / SWA-1234", help: "HMRC AWRS number and your Scotch Whisky Regulations 2009 producer registration. SWA membership reference if applicable." },
    Ireland: { label: "Revenue Distiller's Licence", placeholder: "e.g. DL-2024-0123", help: "Distiller's Licence issued by the Office of the Revenue Commissioners, plus Irish Whiskey GI registration where relevant." },
    USA: { label: "TTB DSP Permit Number", placeholder: "e.g. DSP-KY-12345", help: "Distilled Spirits Plant permit issued by the Alcohol and Tobacco Tax and Trade Bureau (TTB)." },
    France: { label: "Numéro d'Entrepositaire Agréé", placeholder: "e.g. FR123456789", help: "Numéro d'accise délivré par la Direction Générale des Douanes et Droits Indirects (DGDDI)." },
    Germany: { label: "Steuerlagernummer (Hauptzollamt)", placeholder: "e.g. DE00000000000", help: "Herstellungserlaubnis und Steuerlagernummer ausgestellt vom zuständigen Hauptzollamt." },
    Netherlands: { label: "Vergunning AGP (Douane)", placeholder: "e.g. NL/AGP/1234567", help: "Vergunning accijnsgoederenplaats (AGP) afgegeven door de Nederlandse Douane." },
    Belgium: { label: "Vergunning Belastingentrepot (AAD&A)", placeholder: "e.g. BE/AGP/1234567", help: "Vergunning belastingentrepot uitgereikt door de Algemene Administratie van de Douane en Accijnzen." },
    Spain: { label: "Código de Actividad y Establecimiento (CAE)", placeholder: "e.g. ES00012345AB", help: "CAE emitido por la Agencia Estatal de Administración Tributaria para depósitos fiscales." },
    Italy: { label: "Licenza di Deposito Fiscale", placeholder: "e.g. IT00IT00012345A", help: "Codice accisa rilasciato dall'Agenzia delle Dogane e dei Monopoli." },
    Sweden: { label: "Godkänd Upplagshavare (Skatteverket)", placeholder: "e.g. SE0000000000", help: "Godkännande som upplagshavare utfärdat av Skatteverket." },
    Denmark: { label: "Autoriseret Oplagshaver (Skattestyrelsen)", placeholder: "e.g. DK00000000", help: "Autorisation som oplagshaver udstedt af Skattestyrelsen." },
    Poland: { label: "Zezwolenie na Skład Podatkowy (KAS)", placeholder: "e.g. PL00000000000", help: "Zezwolenie na prowadzenie składu podatkowego wydane przez Krajową Administrację Skarbową." },
    Austria: { label: "Steuerlagerbewilligung (Zollamt Österreich)", placeholder: "e.g. AT00000000", help: "Steuerlagerbewilligung ausgestellt vom Zollamt Österreich." },
    Switzerland: { label: "Brennereikonzession (BAZG/EZV)", placeholder: "e.g. CH-BR-12345", help: "Konzession für Brennereien gemäss Alkoholgesetz, ausgestellt vom Bundesamt für Zoll und Grenzsicherheit." },
    Norway: { label: "Bevilling for Alkoholproduksjon (Skatteetaten)", placeholder: "e.g. NO000000000", help: "Bevilling for produksjon av alkohol utstedt av Skatteetaten." },
    Japan: { label: "NTA Spirits Manufacturer Licence", placeholder: "e.g. 国税-12345", help: "Distilled spirits manufacturer licence issued by the National Tax Agency (国税庁)." },
    Canada: { label: "CRA Excise Spirits Licence", placeholder: "e.g. SL-12345", help: "Spirits Licence issued by the Canada Revenue Agency under the Excise Act, 2001." },
    Australia: { label: "ATO Excise Manufacturer Licence", placeholder: "e.g. EXC-12345", help: "Excise Manufacturer Licence issued by the Australian Taxation Office." },
    Other: { label: "Distillery Licence / Permit Number", placeholder: "Your national regulatory licence number", help: "Provide the production / excise licence number issued by the regulator in your country." },
  };

  const licenseConfig = LICENSE_BY_COUNTRY[formData.country] || LICENSE_BY_COUNTRY.Other;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to apply");
      return;
    }

    if (!formData.name || !formData.location || !formData.license_number || !formData.country) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create distillery application
      const { data: distillery, error: distilleryError } = await supabase
        .from('distilleries')
        .insert({
          profile_id: user.id,
          name: formData.name,
          location: `${formData.location}${formData.country ? `, ${formData.country}` : ""}`,
          description: formData.description || null,
          established_year: formData.established_year ? parseInt(formData.established_year) : null,
          license_number: formData.license_number,
          website: formData.website || null,
          verified: false, // Start as unverified
        })
        .select()
        .single();

      if (distilleryError) throw distilleryError;

      // Create notification for admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'administrator');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'distillery_application',
          title: 'New Distillery Application',
          message: `${formData.name} has applied for distillery verification.`,
          link: '/admin/dashboard',
          metadata: { distillery_id: distillery.id }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast.success("Application submitted successfully! We'll review it shortly.");
      navigate('/distillery/verification');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth guard
  if (!user) {
    return (
      <SignInPrompt
        title="Sign in to apply"
        description="You need to be signed in to submit a distillery application."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user already has a distillery application
  if (existingDistillery) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Application Already Submitted</h1>
          <p className="text-muted-foreground mb-6">
            You have already submitted a distillery application for <strong>{existingDistillery.name}</strong>.
            {existingDistillery.verified 
              ? " Your distillery is verified!"
              : " Your application is pending review."}
          </p>
          <Button onClick={() => navigate('/distillery')}>
            Go to Distillery Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If user is already a distillery
  if (userRole === 'distillery') {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">You're Already a Distillery</h1>
          <p className="text-muted-foreground mb-6">
            Your account already has distillery access. Visit your dashboard to manage your casks.
          </p>
          <Button onClick={() => navigate('/distillery')}>
            Go to Distillery Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold luxury-text-gradient">Become a Distillery Partner</h1>
          <p className="text-muted-foreground mt-2">
            Join Angel Share and list your casks on our marketplace
          </p>
        </div>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle>Distillery Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply for a distillery account. 
              Our team will review your application within 2-3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Distillery Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Highland Springs Distillery"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Speyside"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country of Production *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value, license_number: "" }))}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom (England / Wales / NI)</SelectItem>
                      <SelectItem value="Scotland">Scotland</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Netherlands">Netherlands</SelectItem>
                      <SelectItem value="Belgium">Belgium</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                      <SelectItem value="Italy">Italy</SelectItem>
                      <SelectItem value="Sweden">Sweden</SelectItem>
                      <SelectItem value="Denmark">Denmark</SelectItem>
                      <SelectItem value="Poland">Poland</SelectItem>
                      <SelectItem value="Austria">Austria</SelectItem>
                      <SelectItem value="Switzerland">Switzerland</SelectItem>
                      <SelectItem value="Norway">Norway</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="license_number">{licenseConfig.label} *</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder={licenseConfig.placeholder}
                    required
                    disabled={!formData.country}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.country ? licenseConfig.help : "Select your country of production to see the required licence format."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="established_year">Year Established</Label>
                  <Input
                    id="established_year"
                    name="established_year"
                    type="number"
                    min="1700"
                    max={new Date().getFullYear()}
                    value={formData.established_year}
                    onChange={handleInputChange}
                    placeholder="e.g., 1890"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="www.distillery.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">About Your Distillery</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about your distillery, its history, and what makes your spirits special..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Our team will review your application</li>
                  <li>• We may contact you to verify your license</li>
                  <li>• Once approved, you can start listing casks</li>
                  <li>• You'll gain access to the distillery dashboard</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
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

export default DistilleryOnboarding;
