import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, DollarSign, TrendingUp, Warehouse, UserCheck, BadgePoundSterling, ArrowLeftRight, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RoleCounts {
  consumer: number;
  distillery: number;
  investor: number;
  facilitator: number;
  administrator: number;
}

interface MetricsCardsProps {
  metrics: {
    totalAccounts: number;
    roleCounts: RoleCounts;
    newAccounts30d: number;
    totalConsumers: number;
    totalDistillers: number;
    totalOrders: number;
    totalRevenue: number;
    activeListings: number;
    totalInventory: number;
    platformFees: number;
    distilleryFees: number;
    completedTransactions: number;
    pendingTransactions: number;
  };
  loading: boolean;
}

interface CardDef {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  customContent?: React.ReactNode;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  const { formatPrice } = useCurrency();
  const cards: CardDef[] = [
    {
      title: "Total Accounts",
      value: metrics.totalAccounts,
      icon: Users,
      customContent: (
        <>
          <p className="text-xs text-muted-foreground">
            {metrics.roleCounts.consumer} consumers · {metrics.roleCounts.distillery} distilleries · {metrics.roleCounts.investor} investors · {metrics.roleCounts.facilitator} warehouses · {metrics.roleCounts.administrator} admins
          </p>
          <p className="text-xs text-muted-foreground">
            {metrics.newAccounts30d} new in the last 30 days
          </p>
        </>
      )
    },
    {
      title: "Total Consumers",
      value: metrics.totalConsumers,
      icon: Users,
      description: "Registered consumers"
    },
    {
      title: "Total Distillers",
      value: metrics.totalDistillers,
      icon: UserCheck,
      description: "Registered distilleries"
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders,
      icon: Package,
      description: "Completed transactions"
    },
    {
      title: "Total Revenue",
      value: formatPrice(metrics.totalRevenue),
      icon: DollarSign,
      description: "Platform revenue"
    },
    {
      title: "Active Listings",
      value: metrics.activeListings,
      icon: TrendingUp,
      description: "Casks for sale"
    },
    {
      title: "Total Inventory",
      value: `${metrics.totalInventory}L`,
      icon: Warehouse,
      description: "Total cask volume"
    },
    {
      title: "Platform Margin",
      value: formatPrice(metrics.platformFees),
      icon: BadgePoundSterling,
      description: "Total platform fees earned"
    },
    {
      title: "Distillery Fees",
      value: formatPrice(metrics.distilleryFees),
      icon: ArrowLeftRight,
      description: "Total distillery fees collected"
    },
    {
      title: "Completed",
      value: metrics.completedTransactions,
      icon: CheckCircle,
      description: "Completed transactions"
    },
    {
      title: "Pending",
      value: metrics.pendingTransactions,
      icon: Clock,
      description: "Pending transactions"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : card.customContent ? (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.customContent}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
