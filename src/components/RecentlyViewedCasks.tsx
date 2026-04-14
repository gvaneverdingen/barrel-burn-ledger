import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RecentCask {
  id: string;
  spirit_name: string;
  cask_number: string;
  total_price: number | null;
  distillery_name: string;
  viewedAt: number;
}

const STORAGE_KEY = "arigi_recently_viewed";
const MAX_ITEMS = 6;

export const addRecentlyViewed = (cask: Omit<RecentCask, "viewedAt">) => {
  try {
    const existing: RecentCask[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = existing.filter((c) => c.id !== cask.id);
    filtered.unshift({ ...cask, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
};

export const RecentlyViewedCasks = () => {
  const [items, setItems] = useState<RecentCask[]>([]);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    try {
      const stored: RecentCask[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setItems(stored);
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <Card className="luxury-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Recently Viewed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/cask/${item.id}`)}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer transition-colors bg-card"
            >
              <p className="text-sm font-medium truncate">{item.spirit_name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.distillery_name}</p>
              {item.total_price && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {formatPrice(item.total_price)}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
