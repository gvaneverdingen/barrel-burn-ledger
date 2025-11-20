import { useNavigate } from 'react-router-dom';
import { useComparison } from '@/contexts/ComparisonContext';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ComparisonButton = () => {
  const navigate = useNavigate();
  const { comparisonCasks } = useComparison();

  if (comparisonCasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={() => navigate('/comparison')}
        className="shadow-lg relative"
      >
        <ArrowLeftRight className="mr-2 h-5 w-5" />
        Compare Casks
        <Badge variant="secondary" className="ml-2">
          {comparisonCasks.length}
        </Badge>
      </Button>
    </div>
  );
};
