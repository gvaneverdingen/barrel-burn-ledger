import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import caskPlaceholder from '@/assets/cask-placeholder.jpg';

interface FeaturedCask {
  id: string;
  spirit_name: string;
  age_years: number | null;
  region: string | null;
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
        const [casksCount, forSaleCount, distRes, txRes, featuredRes] = await Promise.all([
          supabase.from('casks').select('id', { count: 'exact', head: true }),
          supabase.from('casks').select('id', { count: 'exact', head: true }).eq('available_for_sale', true),
          supabase.from('distilleries').select('id', { count: 'exact', head: true }),
          supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase
            .from('casks_marketplace')
            .select('id, spirit_name, age_years, region, quality_grade, cask_type_name')
            .eq('available_for_sale', true)
            .order('age_years', { ascending: false, nullsFirst: false })
            .limit(3),
        ]);

        if (cancelled) return;

        setStats({
          totalCasks: casksCount.count ?? 0,
          forSale: forSaleCount.count ?? 0,
          distilleries: distRes.count ?? 0,
          completedTx: txRes.count ?? 0,
        });

        // Pull pricing for featured casks from main casks table
        const ids = (featuredRes.data ?? []).map((c) => c.id);
        if (ids.length) {
          const { data: priced } = await supabase
            .from('casks')
            .select('id, total_price')
            .in('id', ids);
          const priceMap = new Map(priced?.map((p) => [p.id, p.total_price]) ?? []);
          setFeatured(
            (featuredRes.data ?? []).map((c) => ({
              ...c,
              total_price: priceMap.get(c.id) ?? null,
            }))
          );
        }
      } catch (e) {
        console.warn('Failed to load home stats', e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
            <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/5 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Blockchain-verified provenance
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-playfair leading-[1.05] mb-6 heritage-text-gradient">
              Own a piece of liquid history.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              ARIGI is the curated marketplace for whole-cask whisky ownership — every barrel verified on-chain,
              sourced direct from distilleries, and tracked from still to glass.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/marketplace')}
                className="heritage-button text-base px-8 h-12 group"
              >
                Explore the Marketplace
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="text-base px-8 h-12 border-primary/40 hover:bg-primary/10"
                >
                  Create Account
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair">
              This week's finest casks
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="text-sm text-primary hover:text-primary/80 inline-flex items-center group"
          >
            View all listings
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <Card className="heritage-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              New casks are being prepared. Check back shortly.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((c, i) => (
              <Card
                key={c.id}
                onClick={() => navigate(`/cask/${c.id}`)}
                className="heritage-card group cursor-pointer overflow-hidden animate-fade-in border-border/50 hover:border-primary/40 transition-all"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={caskPlaceholder}
                    alt={c.spirit_name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                      {c.spirit_name}
                    </h3>
                    {c.age_years && (
                      <span className="text-sm text-primary font-medium shrink-0">{c.age_years}y</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                    {c.region ?? 'Unknown region'}
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair mb-4">
              From distillery to your portfolio
            </h2>
            <p className="text-muted-foreground text-lg">
              Three simple steps. Full transparency at every stage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {[
              {
                icon: Eye,
                step: '01',
                title: 'Browse verified casks',
                body: 'Explore curated single-barrel listings from accredited distilleries. Filter by age, region, finish and price.',
              },
              {
                icon: Shield,
                step: '02',
                title: 'Buy with confidence',
                body: 'Every cask is minted as an NFT on Polygon. Pay by card or stablecoin — escrow protects both sides.',
              },
              {
                icon: TrendingUp,
                step: '03',
                title: 'Track, trade or take delivery',
                body: 'Watch your cask mature, list it on the secondary market, or bottle it when the time is right.',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair mb-6 leading-tight">
              Every cask, <span className="heritage-text-gradient">cryptographically proven.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We mint each cask as a unique NFT before it reaches the marketplace. The result: an immutable
              chain of custody from the moment new-make spirit enters the barrel to the day it's bottled.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'On-chain ownership records on Polygon',
                'Verified distillery licensing & gauging history',
                'Atomic escrow protects buyer & seller',
                'Full audit trail accessible from any cask page',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>

            <Button onClick={() => navigate('/marketplace')} size="lg" className="heritage-button">
              Start exploring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: 'On-chain', sub: 'Polygon NFT' },
              { icon: Gem, label: 'Curated', sub: 'Verified casks' },
              { icon: Link2, label: 'Direct', sub: 'From distilleries' },
              { icon: Crown, label: 'Whole cask', sub: 'Sole ownership' },
            ].map((f, i) => (
              <Card
                key={f.label}
                className="heritage-card animate-fade-in border-border/50"
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
        <Card className="heritage-card overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-8 sm:p-12 lg:p-16 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-playfair mb-3">
                A distillery? Reach a global collector base.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                List your casks, manage inventory on-chain, and settle in fiat or stablecoin — with a fee
                structure built for craft producers.
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
