import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

interface IncompleteCask {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  price_per_liter: number | null;
  total_price: number | null;
  current_volume_liters: number | null;
  alcohol_percentage: number | null;
  available_for_sale: boolean;
  distilleries: {
    name: string;
  } | null;
}

// Validation schema for pricing fields
const pricingSchema = z.object({
  price_per_liter: z.number().positive({ message: "Price per liter must be positive" }),
  total_price: z.number().positive({ message: "Total price must be positive" }),
  current_volume_liters: z.number().positive({ message: "Volume must be positive" }),
  alcohol_percentage: z.number().min(0).max(100, { message: "ABV must be between 0 and 100" })
});

interface EditingData {
  price_per_liter: string;
  total_price: string;
  current_volume_liters: string;
  alcohol_percentage: string;
}

export default function CaskDataManagement() {
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [selectedCasks, setSelectedCasks] = useState<string[]>([]);
  const [editingCaskId, setEditingCaskId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingData>({
    price_per_liter: '',
    total_price: '',
    current_volume_liters: '',
    alcohol_percentage: ''
  });

  const { data: incompleteCasks, isLoading } = useQuery({
    queryKey: ['incomplete-casks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('casks')
        .select(`
          id,
          spirit_name,
          cask_number,
          distillation_date,
          price_per_liter,
          total_price,
          current_volume_liters,
          alcohol_percentage,
          available_for_sale,
          distilleries (
            name
          )
        `)
        .or('price_per_liter.is.null,total_price.is.null,current_volume_liters.is.null,alcohol_percentage.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IncompleteCask[];
    }
  });

  const markUnavailableMutation = useMutation({
    mutationFn: async (caskIds: string[]) => {
      const { error } = await supabase
        .from('casks')
        .update({ available_for_sale: false })
        .in('id', caskIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomplete-casks'] });
      toast.success(`Successfully marked ${selectedCasks.length} cask(s) as unavailable`);
      setSelectedCasks([]);
    },
    onError: (error) => {
      toast.error('Failed to update casks: ' + error.message);
    }
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ caskId, data }: { caskId: string; data: z.infer<typeof pricingSchema> }) => {
      const { error } = await supabase
        .from('casks')
        .update({
          price_per_liter: data.price_per_liter,
          total_price: data.total_price,
          current_volume_liters: data.current_volume_liters,
          alcohol_percentage: data.alcohol_percentage,
          available_for_sale: true // Make available once pricing is complete
        })
        .eq('id', caskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomplete-casks'] });
      toast.success('Cask pricing updated successfully');
      setEditingCaskId(null);
      setEditingData({
        price_per_liter: '',
        total_price: '',
        current_volume_liters: '',
        alcohol_percentage: ''
      });
    },
    onError: (error) => {
      toast.error('Failed to update pricing: ' + error.message);
    }
  });

  const toggleCaskSelection = (caskId: string) => {
    setSelectedCasks(prev => 
      prev.includes(caskId) 
        ? prev.filter(id => id !== caskId)
        : [...prev, caskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCasks.length === incompleteCasks?.length) {
      setSelectedCasks([]);
    } else {
      setSelectedCasks(incompleteCasks?.map(c => c.id) || []);
    }
  };

  const handleBulkMarkUnavailable = () => {
    if (selectedCasks.length === 0) {
      toast.error('Please select at least one cask');
      return;
    }
    markUnavailableMutation.mutate(selectedCasks);
  };

  const handleEdit = (cask: IncompleteCask) => {
    setEditingCaskId(cask.id);
    setEditingData({
      price_per_liter: cask.price_per_liter?.toString() || '',
      total_price: cask.total_price?.toString() || '',
      current_volume_liters: cask.current_volume_liters?.toString() || '',
      alcohol_percentage: cask.alcohol_percentage?.toString() || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCaskId(null);
    setEditingData({
      price_per_liter: '',
      total_price: '',
      current_volume_liters: '',
      alcohol_percentage: ''
    });
  };

  const handleSave = (caskId: string) => {
    try {
      // Validate input
      const validatedData = pricingSchema.parse({
        price_per_liter: parseFloat(editingData.price_per_liter),
        total_price: parseFloat(editingData.total_price),
        current_volume_liters: parseFloat(editingData.current_volume_liters),
        alcohol_percentage: parseFloat(editingData.alcohol_percentage)
      });

      updatePricingMutation.mutate({ caskId, data: validatedData });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error('Invalid input data');
      }
    }
  };

  const getMissingFields = (cask: IncompleteCask) => {
    const missing: string[] = [];
    if (cask.price_per_liter === null) missing.push('Price/L');
    if (cask.total_price === null) missing.push('Total Price');
    if (cask.current_volume_liters === null) missing.push('Volume');
    if (cask.alcohol_percentage === null) missing.push('ABV');
    return missing;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Cask Data Management</h1>
        <p className="text-muted-foreground">
          View and manage casks with incomplete pricing information
        </p>
      </div>

      {incompleteCasks && incompleteCasks.length > 0 ? (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Found {incompleteCasks.length} cask(s) with incomplete pricing data. 
              These casks cannot be sold until all pricing fields are completed.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Incomplete Casks</CardTitle>
                  <CardDescription>
                    Select casks to mark as unavailable for sale
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleSelectAll}
                    disabled={!incompleteCasks || incompleteCasks.length === 0}
                  >
                    {selectedCasks.length === incompleteCasks?.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={handleBulkMarkUnavailable}
                    disabled={selectedCasks.length === 0 || markUnavailableMutation.isPending}
                  >
                    {markUnavailableMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Mark {selectedCasks.length > 0 ? `${selectedCasks.length} ` : ''}Unavailable
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedCasks.length === incompleteCasks.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Cask Number</TableHead>
                      <TableHead>Spirit Name</TableHead>
                      <TableHead>Distillery</TableHead>
                      <TableHead>Price/L</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Volume (L)</TableHead>
                      <TableHead>ABV %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incompleteCasks.map((cask) => {
                      const isEditing = editingCaskId === cask.id;
                      
                      return (
                        <TableRow key={cask.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedCasks.includes(cask.id)}
                              onChange={() => toggleCaskSelection(cask.id)}
                              className="rounded border-gray-300"
                              disabled={isEditing}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{cask.cask_number}</TableCell>
                          <TableCell>{cask.spirit_name}</TableCell>
                          <TableCell>{cask.distilleries?.name || 'Unknown'}</TableCell>
                          
                          {/* Price per Liter */}
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingData.price_per_liter}
                                onChange={(e) => setEditingData(prev => ({ ...prev, price_per_liter: e.target.value }))}
                                className="w-24"
                                placeholder="Price/L"
                              />
                            ) : (
                              <span className={cask.price_per_liter === null ? 'text-red-500' : ''}>
                                {cask.price_per_liter !== null ? formatPrice(cask.price_per_liter) : 'Missing'}
                              </span>
                            )}
                          </TableCell>
                          
                          {/* Total Price */}
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingData.total_price}
                                onChange={(e) => setEditingData(prev => ({ ...prev, total_price: e.target.value }))}
                                className="w-24"
                                placeholder="Total"
                              />
                            ) : (
                              <span className={cask.total_price === null ? 'text-red-500' : ''}>
                                {cask.total_price !== null ? `$${cask.total_price}` : 'Missing'}
                              </span>
                            )}
                          </TableCell>
                          
                          {/* Volume */}
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={editingData.current_volume_liters}
                                onChange={(e) => setEditingData(prev => ({ ...prev, current_volume_liters: e.target.value }))}
                                className="w-20"
                                placeholder="Volume"
                              />
                            ) : (
                              <span className={cask.current_volume_liters === null ? 'text-red-500' : ''}>
                                {cask.current_volume_liters !== null ? cask.current_volume_liters : 'Missing'}
                              </span>
                            )}
                          </TableCell>
                          
                          {/* ABV */}
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={editingData.alcohol_percentage}
                                onChange={(e) => setEditingData(prev => ({ ...prev, alcohol_percentage: e.target.value }))}
                                className="w-20"
                                placeholder="ABV"
                              />
                            ) : (
                              <span className={cask.alcohol_percentage === null ? 'text-red-500' : ''}>
                                {cask.alcohol_percentage !== null ? `${cask.alcohol_percentage}%` : 'Missing'}
                              </span>
                            )}
                          </TableCell>
                          
                          {/* Status */}
                          <TableCell>
                            {cask.available_for_sale ? (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Listed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Unavailable
                              </Badge>
                            )}
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(cask.id)}
                                  disabled={updatePricingMutation.isPending}
                                >
                                  {updatePricingMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={updatePricingMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(cask)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
            <p className="text-muted-foreground text-center">
              All casks have complete pricing information. No action needed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
