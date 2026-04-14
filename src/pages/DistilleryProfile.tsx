import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Calendar, Shield, Globe, Wine, Eye } from 'lucide-react';
import caskPlaceholder from '@/assets/cask-placeholder.jpg';

interface DistilleryData {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  established_year: number | null;
  logo_url: string | null;
  website: string | null;
  verified: boolean | null;
}

interface DistilleryCask {
  id: string;
  spirit_name: string;
  cask_number: string;
  total_price: number | null;
  available_for_sale: boolean | null;
  age_years: number | null;
  region: string | null;
}

const DistilleryProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [distillery, setDistillery] = useState<DistilleryData | null>(null);
  const [casks, setCasks] = useState<DistilleryCask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDistillery = async () => {
      setLoading(true);

      const { data: distData, error: distErr } = await supabase
        .from('distilleries_public')
        .select('id, name, location, description, established_year, logo_url, website, verified')
        .eq('id', id)
        .maybeSingle();

      if (distErr) {
        console.error('Error fetching distillery:', distErr);
        setLoading(false);
        return;
      }

      if (distData) {
        setDistillery(distData as DistilleryData);

        const { data: caskData } = await supabase
          .from('casks')
          .select('id, spirit_name, cask_number, total_price, available_for_sale, age_years, region')
          .eq('distillery_id', id)
          .eq('available_for_sale', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (caskData) setCasks(caskData);
      }

      setLoading(false);
    };

    fetchDistillery();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!distillery) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Distillery Not Found</h2>
        <p className="text-muted-foreground mb-6">This distillery may not exist or is not yet verified.</p>
        <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/marketplace">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Link>
      </Button>

      {/* Distillery Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {distillery.logo_url ? (
              <img
                src={distillery.logo_url}
                alt={distillery.name}
                className="h-20 w-20 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Wine className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{distillery.name}</h1>
                {distillery.verified && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                {distillery.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {distillery.location}
                  </span>
                )}
                {distillery.established_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Est. {distillery.established_year}
                  </span>
                )}
                {distillery.website && (
                  <a
                    href={distillery.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
              </div>

              {distillery.description && (
                <p className="text-muted-foreground leading-relaxed">{distillery.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Casks */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Available Casks</h2>
        <p className="text-sm text-muted-foreground">{casks.length} cask{casks.length !== 1 ? 's' : ''} currently for sale</p>
      </div>

      {casks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No casks currently available from this distillery.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {casks.map((cask) => (
            <Card
              key={cask.id}
              className="mobile-card hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate(`/cask/${cask.id}`)}
            >
              <div className="relative h-36 sm:h-44 overflow-hidden bg-muted">
                <img src={caskPlaceholder} alt={cask.spirit_name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base truncate">{cask.spirit_name}</CardTitle>
                <CardDescription className="text-xs">Cask #{cask.cask_number}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-bold">{formatPrice(cask.total_price || 0)}</span>
                </div>
                {cask.age_years && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">Age</span>
                    <span className="text-sm">{cask.age_years} years</span>
                  </div>
                )}
                <Button size="sm" className="w-full mt-3" variant="outline">
                  <Eye className="h-4 w-4 mr-2" /> View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistilleryProfile;
