import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface ComparisonCask {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillery?: {
    name: string;
    location?: string;
  };
  distillation_date: string;
  current_volume_liters?: number;
  alcohol_percentage?: number;
  price_per_liter?: number;
  total_price?: number;
  cask_type?: {
    name: string;
    capacity_liters: number;
  };
  tasting_notes?: string;
  warehouse_location?: string;
  expected_maturation_years?: number;
}

interface ComparisonContextType {
  comparisonCasks: ComparisonCask[];
  addToComparison: (cask: ComparisonCask) => void;
  removeFromComparison: (caskId: string) => void;
  clearComparison: () => void;
  isInComparison: (caskId: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON_CASKS = 4;

export const ComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [comparisonCasks, setComparisonCasks] = useState<ComparisonCask[]>([]);

  const addToComparison = (cask: ComparisonCask) => {
    if (comparisonCasks.length >= MAX_COMPARISON_CASKS) {
      toast.error(`You can compare up to ${MAX_COMPARISON_CASKS} casks at a time`);
      return;
    }

    if (comparisonCasks.some(c => c.id === cask.id)) {
      toast.info('This cask is already in your comparison');
      return;
    }

    setComparisonCasks(prev => [...prev, cask]);
    toast.success('Added to comparison');
  };

  const removeFromComparison = (caskId: string) => {
    setComparisonCasks(prev => prev.filter(c => c.id !== caskId));
    toast.success('Removed from comparison');
  };

  const clearComparison = () => {
    setComparisonCasks([]);
    toast.success('Comparison cleared');
  };

  const isInComparison = (caskId: string) => {
    return comparisonCasks.some(c => c.id === caskId);
  };

  return (
    <ComparisonContext.Provider value={{
      comparisonCasks,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
};
