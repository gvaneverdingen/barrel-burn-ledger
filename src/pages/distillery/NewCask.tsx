import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Wine } from 'lucide-react';
import CaskAdvancedSpecsFields, {
  AdvancedSpecsState,
  emptyAdvancedSpecs,
  buildAdvancedSpecsPayload,
  validateAdvancedSpecs,
} from '@/components/CaskAdvancedSpecsFields';

const NewCask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedSpecs, setAdvancedSpecs] = useState<AdvancedSpecsState>(emptyAdvancedSpecs);
  
  const [formData, setFormData] = useState({
    cask_number: '',
    spirit_name: '',
    distillation_date: '',
    cask_type_id: '',
    current_volume_liters: '',
    alcohol_percentage: '',
    price_per_liter: '',
    warehouse_location: '',
    region: '',
    tasting_notes: '',
    quality_grade: '',
    expected_maturation_years: '',
    available_for_sale: false,
    last_gauging_date: '',
  });

  // Fetch distillery for the current user
  const { data: distillery, isLoading: distilleryLoading } = useQuery({
    queryKey: ['distillery', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch cask types
  const { data: caskTypes } = useQuery({
    queryKey: ['cask-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cask_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!distillery) {
      toast.error('No distillery found. Please complete distillery onboarding first.');
      navigate('/distillery/onboarding');
      return;
    }

    if (!formData.cask_number || !formData.spirit_name || !formData.distillation_date || !formData.cask_type_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a blockchain ID for the cask
      const blockchainId = `CASK-${distillery.id.slice(0, 8)}-${Date.now()}`;
      
      const currentVolume = parseFloat(formData.current_volume_liters) || null;
      const pricePerLiter = parseFloat(formData.price_per_liter) || null;
      const totalPrice = currentVolume && pricePerLiter ? currentVolume * pricePerLiter : null;

      const { data, error } = await supabase
        .from('casks')
        .insert({
          cask_number: formData.cask_number,
          spirit_name: formData.spirit_name,
          distillation_date: formData.distillation_date,
          cask_type_id: formData.cask_type_id,
          distillery_id: distillery.id,
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
          ...buildAdvancedSpecsPayload(advancedSpecs),
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate casks query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['distillery-casks'] });
      
      toast.success('Cask created successfully! Minting NFT...');

      // Auto-mint the cask as an NFT on Polygon
      try {
        const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-cask-nft', {
          body: { caskId: data.id },
        });

        if (mintError || !mintResult?.success) {
          console.error('Auto-mint failed:', mintError || mintResult?.error);
          toast.error('Cask created but NFT minting failed. You can mint it later from the cask details page.');
        } else {
          toast.success(`NFT minted! Token #${mintResult.tokenId} on Polygon.`);
        }
      } catch (mintErr) {
        console.error('Auto-mint error:', mintErr);
        toast.error('Cask created but NFT minting failed. You can retry from the cask details page.');
      }

      navigate('/distillery/casks');
    } catch (error: any) {
      console.error('Error creating cask:', error);
      toast.error(error.message || 'Failed to create cask');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (distilleryLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!distillery) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Distillery Found</CardTitle>
            <CardDescription>
              You need to complete the distillery onboarding process before adding casks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/distillery/onboarding')} className="w-full">
              Start Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/distillery/casks')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Casks
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-6 w-6" />
              Add New Cask
            </CardTitle>
            <CardDescription>
              Register a new cask in your inventory for {distillery.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cask_number">Cask Number *</Label>
                    <Input
                      id="cask_number"
                      name="cask_number"
                      value={formData.cask_number}
                      onChange={handleInputChange}
                      placeholder="e.g., CASK-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spirit_name">Spirit Name *</Label>
                    <Input
                      id="spirit_name"
                      name="spirit_name"
                      value={formData.spirit_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Single Malt Whisky"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distillation_date">Distillation Date *</Label>
                    <Input
                      id="distillation_date"
                      name="distillation_date"
                      type="date"
                      value={formData.distillation_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cask_type_id">Cask Type *</Label>
                    <Select
                      value={formData.cask_type_id}
                      onValueChange={(value) => handleSelectChange('cask_type_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cask type" />
                      </SelectTrigger>
                      <SelectContent>
                        {caskTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.capacity_liters}L)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Volume & Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Volume & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_volume_liters">Current Volume (L)</Label>
                    <Input
                      id="current_volume_liters"
                      name="current_volume_liters"
                      type="number"
                      step="0.01"
                      value={formData.current_volume_liters}
                      onChange={handleInputChange}
                      placeholder="e.g., 200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alcohol_percentage">ABV (%)</Label>
                    <Input
                      id="alcohol_percentage"
                      name="alcohol_percentage"
                      type="number"
                      step="0.1"
                      value={formData.alcohol_percentage}
                      onChange={handleInputChange}
                      placeholder="e.g., 63.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_gauging_date">Last Gauging Date</Label>
                    <Input
                      id="last_gauging_date"
                      name="last_gauging_date"
                      type="date"
                      value={formData.last_gauging_date}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground">Date when LPA and ABV were last measured</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_liter">Price per Liter (£)</Label>
                    <Input
                      id="price_per_liter"
                      name="price_per_liter"
                      type="number"
                      step="0.01"
                      value={formData.price_per_liter}
                      onChange={handleInputChange}
                      placeholder="e.g., 50.00"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Maturation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location & Maturation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warehouse_location">Warehouse Location</Label>
                    <Input
                      id="warehouse_location"
                      name="warehouse_location"
                      value={formData.warehouse_location}
                      onChange={handleInputChange}
                      placeholder="e.g., Warehouse A, Rack 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      placeholder="e.g., Speyside, Scotland"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quality_grade">Quality Grade</Label>
                    <Select
                      value={formData.quality_grade}
                      onValueChange={(value) => handleSelectChange('quality_grade', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Exceptional">Exceptional</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_maturation_years">Expected Maturation (Years)</Label>
                    <Input
                      id="expected_maturation_years"
                      name="expected_maturation_years"
                      type="number"
                      value={formData.expected_maturation_years}
                      onChange={handleInputChange}
                      placeholder="e.g., 12"
                    />
                  </div>
                </div>
              </div>

              {/* Tasting Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tasting Notes</h3>
                <div className="space-y-2">
                  <Textarea
                    id="tasting_notes"
                    name="tasting_notes"
                    value={formData.tasting_notes}
                    onChange={handleInputChange}
                    placeholder="Describe the flavor profile, aroma, and character of this cask..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Provenance & Cooperage */}
              <CaskAdvancedSpecsFields value={advancedSpecs} onChange={setAdvancedSpecs} />

              {/* Availability */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="available_for_sale" className="text-base font-medium">
                    Available for Sale
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Make this cask visible in the marketplace
                  </p>
                </div>
                <Switch
                  id="available_for_sale"
                  checked={formData.available_for_sale}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, available_for_sale: checked }))
                  }
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/distillery/casks')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 luxury-button"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Cask
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCask;
