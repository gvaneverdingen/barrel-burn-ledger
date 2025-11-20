import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparison } from '@/contexts/ComparisonContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Comparison = () => {
  const navigate = useNavigate();
  const { comparisonCasks, removeFromComparison, clearComparison } = useComparison();

  if (comparisonCasks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">No Casks to Compare</h2>
          <p className="text-muted-foreground mb-6">
            Add casks from the marketplace to compare their details side-by-side
          </p>
          <Button onClick={() => navigate('/marketplace')}>
            Browse Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  const comparisonFields = [
    { label: 'Spirit Name', key: 'spirit_name' },
    { label: 'Cask Number', key: 'cask_number' },
    { label: 'Distillery', key: (cask: any) => cask.distillery?.name || 'N/A' },
    { label: 'Location', key: (cask: any) => cask.distillery?.location || 'N/A' },
    { label: 'Distillation Date', key: 'distillation_date' },
    { label: 'Age (Years)', key: (cask: any) => {
      const years = new Date().getFullYear() - new Date(cask.distillation_date).getFullYear();
      return `${years} years`;
    }},
    { label: 'Expected Maturation', key: (cask: any) => cask.expected_maturation_years ? `${cask.expected_maturation_years} years` : 'N/A' },
    { label: 'Volume', key: (cask: any) => cask.current_volume_liters ? `${cask.current_volume_liters}L` : 'N/A' },
    { label: 'ABV', key: (cask: any) => cask.alcohol_percentage ? `${cask.alcohol_percentage}%` : 'N/A' },
    { label: 'Cask Type', key: (cask: any) => cask.cask_type?.name || 'N/A' },
    { label: 'Capacity', key: (cask: any) => cask.cask_type?.capacity_liters ? `${cask.cask_type.capacity_liters}L` : 'N/A' },
    { label: 'Price per Liter', key: (cask: any) => cask.price_per_liter ? `£${Number(cask.price_per_liter).toLocaleString()}` : 'N/A' },
    { label: 'Total Price', key: (cask: any) => cask.total_price ? `£${Number(cask.total_price).toLocaleString()}` : 'N/A' },
    { label: 'Warehouse', key: (cask: any) => cask.warehouse_location || 'N/A' },
    { label: 'Tasting Notes', key: (cask: any) => cask.tasting_notes || 'N/A' },
  ];

  const getValue = (cask: any, field: any) => {
    if (typeof field.key === 'function') {
      return field.key(cask);
    }
    return cask[field.key] || 'N/A';
  };

  return (
    <div className="mobile-container pb-20 lg:pb-8">
      <div className="mobile-sticky-header py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')} className="mobile-touch-target">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h1 className="mobile-heading font-bold">Compare Casks</h1>
          </div>
          <Button variant="outline" size="sm" onClick={clearComparison} className="mobile-touch-target w-full sm:w-auto">
            Clear All
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-6">
        <div className="inline-block min-w-full align-middle">
          <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `minmax(120px, 200px) repeat(${comparisonCasks.length}, minmax(200px, 1fr))` }}>
            {/* Header row with cask names */}
            <div className="font-semibold bg-muted p-4 rounded-lg">
              Attribute
            </div>
            {comparisonCasks.map((cask) => (
              <Card key={cask.id} className="p-4 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeFromComparison(cask.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <h3 className="font-bold text-lg mb-1">{cask.spirit_name}</h3>
                <p className="text-sm text-muted-foreground">{cask.cask_number}</p>
              </Card>
            ))}

            {/* Comparison rows */}
            {comparisonFields.map((field, idx) => (
              <React.Fragment key={field.label}>
                <div className="bg-muted/50 p-4 font-medium flex items-center">
                  {field.label}
                </div>
                {comparisonCasks.map((cask) => (
                  <div key={`${cask.id}-${idx}`} className="p-4 border rounded-lg flex items-center">
                    <span className={field.label === 'Tasting Notes' ? 'text-sm' : ''}>
                      {getValue(cask, field)}
                    </span>
                  </div>
                ))}
              </React.Fragment>
            ))}

            {/* Actions row */}
            <div className="bg-muted/50 p-4 font-medium flex items-center">
              Actions
            </div>
            {comparisonCasks.map((cask) => (
              <div key={`${cask.id}-actions`} className="p-4 border rounded-lg space-y-2">
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => navigate(`/cask/${cask.id}`)}
                >
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => removeFromComparison(cask.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
