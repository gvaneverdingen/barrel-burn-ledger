import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface RecentCask {
  id: string;
  name: string;
  price: number;
  viewedAt: number;
}

const STORAGE_KEY = 'arigi_recently_viewed';
const MAX_ITEMS = 6;

export const addRecentlyViewed = (cask: Omit<RecentCask, 'viewedAt'>) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: RecentCask[] = raw ? JSON.parse(raw) : [];
    items = items.filter((c) => c.id !== cask.id);
    items.unshift({ ...cask, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {}
};

export const RecentlyViewedCasks = () => {
  const [items, setItems] = useState<RecentCask[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
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
                ${item.price?.toLocaleString() ?? 'N/A'}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
