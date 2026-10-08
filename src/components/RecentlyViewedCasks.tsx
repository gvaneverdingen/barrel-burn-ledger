import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { caskDisplayName } from '@/lib/caskDisplay';

interface StoredItem {
  id: string;
  viewedAt: number;
}

interface LiveCask {
  id: string;
  name: string;
  price: number | null;
}

const STORAGE_KEY = 'arigi_recently_viewed';
const MAX_ITEMS = 6;

const readStored = (): StoredItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((c) => c && typeof c.id === 'string').map((c) => ({ id: c.id, viewedAt: Number(c.viewedAt) || 0 }))
      : [];
  } catch {
    return [];
  }
};

/** Only the cask id is stored; name and price are looked up fresh when rendering. */
export const addRecentlyViewed = (cask: { id: string }) => {
  try {
    const items = readStored().filter((c) => c.id !== cask.id);
    items.unshift({ id: cask.id, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {}
};

export const RecentlyViewedCasks = () => {
  const [items, setItems] = useState<LiveCask[]>([]);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const stored = readStored();
    // Rewrite legacy entries (which cached names/prices) to ids only
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {}
    if (stored.length === 0) return;
    let cancelled = false;
    supabase
      .from('casks')
      .select('id, spirit_name, distillation_date, total_price')
      .in('id', stored.map((s) => s.id))
      .then(({ data }) => {
        if (cancelled || !data) return;
        const byId = new Map(data.map((c) => [c.id, c]));
        setItems(
          stored
            .map((s) => byId.get(s.id))
            .filter(Boolean)
            .map((c: any) => ({
              id: c.id,
              name: caskDisplayName(c.spirit_name, c.distillation_date),
              price: c.total_price,
            })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <Card className="luxury-card mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recently Viewed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/cask/${item.id}`)}
              className="shrink-0 rounded-lg border border-border/60 bg-card p-3 text-left hover:border-primary/40 transition-colors min-w-[160px]"
            >
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.price != null ? formatPrice(Number(item.price)) : 'Price on request'}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
