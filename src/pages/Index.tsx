import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight,
  Shield,
  Link2,
  Eye,
  Sparkles,
  Crown,
  Gem,
  TrendingUp,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import heroCask from '@/assets/hero-cask-luxury.jpg';
import { fetchMarketplaceListings } from '@/lib/marketplaceListings';
import { caskAgeYears, caskDisplayName, defaultCaskImage } from '@/lib/caskDisplay';

interface FeaturedCask {
  id: string;
  spirit_name: string;
  distillation_date: string | null;
  location: string | null;
  image_url: string | null;
  total_price: number | null;
  quality_grade: string | null;
  cask_type_name?: string | null;
}

interface PlatformStats {
  totalCasks: number;
  forSale: number;
  distilleries: number;
  completedTx: number;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stats, setStats] = useState<PlatformStats>({
    totalCasks: 0,
    forSale: 0,
    distilleries: 0,
    completedTx: 0,
  });
  const [featured, setFeatured] = useState<FeaturedCask[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Stripe redirect handling
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      navigate(`/payment-success?session_id=${encodeURIComponent(sessionId)}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Live platform stats + featured casks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [casksCount, distRes, txRes, listings] = await Promise.all([
          supabase.from('casks').select('id', { count: 'exact', head: true }),
          supabase.from('distilleries').select('id', { count: 'exact', head: true }),
          supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
          fetchMarketplaceListings(!!user),
        ]);

        if (cancelled) return;

        setStats({
          totalCasks: casksCount.count ?? 0,
          forSale: listings.length,
          distilleries: distRes.count ?? 0,
          completedTx: txRes.count ?? 0,
        });

        // Oldest cask per distillery, so the section never repeats one product
        const byDistillery = new Map<string, any>();
        [...listings]
          .sort((x, y) => String(x.distillation_date).localeCompare(String(y.distillation_date)))
          .forEach((l) => {
            const key = l.distillery_id || l.distilleries?.name || l.cask_id;
            if (!byDistillery.has(key)) byDistillery.set(key, l);
          });
        setFeatured(
          Array.from(byDistillery.values()).slice(0, 3).map((l) => ({
            id: l.cask_id,
            spirit_name: l.spirit_name,
            distillation_date: l.distillation_date,
            location: l.distilleries?.location || l.region || null,
            total_price: l.total_price ?? null,
            quality_grade: l.quality_grade ?? null,
            cask_type_name: l.cask_types?.name ?? null,
            image_url: l.image_url ?? null,
          }))
        );
      } catch (e) {
        console.warn('Failed to load home stats', e);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroCask}
            alt="Single oak whisky cask in a moody dunnage warehouse"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-40">
          <div className="max-w-2xl animate-fade-in">
            <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Blockchain-verified provenance
            </Badge>
            <h1 className="font-playfair mb-6 [text-wrap:balance]">
              <span className="block text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] heritage-text-gradient">
                A whole cask of whisky.
              </span>
              <span className="block mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-foreground">
                With the paperwork to prove it.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Buy a maturing cask straight from the distillery that filled it, or from an owner whose title
              we’ve checked. Every cask is recorded on the blockchain, so you can see who owns it without
              taking our word for it.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/marketplace')}
                className="heritage-button-hero text-base px-8 h-12 group"
              >
                Browse casks for sale
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="text-base px-8 h-12 border-primary/40 hover:bg-primary/10"
                >
                  Create an account
                </Button>
              )}
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-14 bg-border/40 rounded-xl overflow-hidden border border-border/40 backdrop-blur-sm">
              {[
                { label: 'Casks listed', value: stats.totalCasks },
                { label: 'For sale now', value: stats.forSale },
                { label: 'Distilleries', value: stats.distilleries },
                { label: 'Trades settled', value: stats.completedTx },
              ].map((s) => (
                <div key={s.label} className="bg-card/80 px-4 py-4 sm:py-5">
                  <div className="text-2xl sm:text-3xl font-bold font-playfair text-primary">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== FEATURED CASKS ============== */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex items-end justify-between mb-8 sm:mb-12 gap-4 flex-wrap">
          <div>
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
              Featured
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-playfair">
              The oldest cask from each distillery
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="text-sm text-primary hover:text-primary/80 inline-flex items-center group"
          >
            See every cask for sale
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading featured casks">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="heritage-card overflow-hidden border-border/50">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <Card className="heritage-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              Nothing is listed right now. New casks appear here as soon as a distillery or owner lists one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((c, i) => (
              <Card
                key={c.id}
                onClick={() => navigate(`/cask/${c.id}`)}
                className="heritage-card group cursor-pointer overflow-hidden border-border/50 hover:border-primary/40 transition-all"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={c.image_url || defaultCaskImage(c.cask_type_name, c.id)}
                    alt={caskDisplayName(c.spirit_name, c.distillation_date)}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  {c.quality_grade && (
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0">
                      {c.quality_grade}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-playfair font-semibold text-lg leading-tight line-clamp-1">
                      {caskDisplayName(c.spirit_name, c.distillation_date)}
                    </h3>
                    {caskAgeYears(c.distillation_date) ? (
                      <span className="text-sm text-primary font-medium shrink-0">{caskAgeYears(c.distillation_date)}y</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                    {c.location ?? 'Unknown region'}
                    {c.cask_type_name ? ` · ${c.cask_type_name}` : ''}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Whole cask</div>
                      <div className="text-xl font-bold text-foreground">
                        {c.total_price ? formatPrice(Number(c.total_price)) : 'Enquire'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
              How it works
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-playfair mb-4">
              How buying a cask works
            </h2>
            <p className="text-muted-foreground text-lg">
              Three steps, and nothing hidden along the way.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {[
              {
                icon: Eye,
                step: '01',
                title: 'Find your cask',
                body: 'Every cask is listed by the distillery that filled it, or resold by an owner we’ve verified. Search by name or distillery, then narrow it down by cask type and price.',
              },
              {
                icon: Shield,
                step: '02',
                title: 'Buy it outright',
                body: 'Pay by card or USDC. You see the price and every fee before you commit, and the cask’s ownership record lives on the Polygon blockchain, not in our spreadsheet.',
              },
              {
                icon: TrendingUp,
                step: '03',
                title: 'Hold it, sell it or bottle it',
                body: 'Your cask matures in a bonded warehouse. When you’re ready, resell it on the same marketplace, or ask the distillery to bottle it for you.',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-playfair font-bold text-primary/15 mb-4 leading-none">
                  {s.step}
                </div>
                <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-playfair font-semibold mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== TRUST / PROVENANCE ============== */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Provenance
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-playfair mb-6 leading-tight">
              Ownership you can <span className="text-primary">check for yourself.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Before a cask can be listed, we record it on the Polygon blockchain: the distillery, fill date,
              cask type, strength and every change of owner. The record is public, so you can check it without
              asking us, and we can’t quietly change it.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'Ownership recorded on Polygon, readable by anyone',
                'Distilleries checked before they can list a cask',
                'Regauges and transfers logged against each cask',
                'The full history, one click from every cask page',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>

            <Button onClick={() => navigate('/marketplace')} size="lg" className="heritage-button">
              See the casks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: 'On-chain', sub: 'A public record we can’t edit' },
              { icon: Gem, label: 'Checked', sub: 'Distilleries vetted before listing' },
              { icon: Link2, label: 'Direct', sub: 'No brokers between you and the still' },
              { icon: Crown, label: 'Whole cask', sub: 'One cask, one owner: you' },
            ].map((f, i) => (
              <Card
                key={f.label}
                className="heritage-card border-border/50"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-2.5 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-playfair font-semibold text-lg">{f.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{f.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============== DISTILLERY CTA ============== */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <Card className="heritage-card overflow-hidden border-primary/20">
          <CardContent className="p-8 sm:p-12 lg:p-16 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-playfair mb-3">
                Run a distillery? Sell your casks direct.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                List casks at your own price, with no chain of brokers in between. Your inventory lives
                on-chain, buyers pay by card or USDC, and ARIGI takes a 5% fee only when a cask sells.
              </p>
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/distillery/onboarding')}
              className="border-primary/50 hover:bg-primary/10 h-12 px-8 shrink-0"
            >
              Apply to list
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
