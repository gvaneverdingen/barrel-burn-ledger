import { Badge } from '@/components/ui/badge';
import { IS_TESTNET } from '@/lib/chain';

/** Small label shown next to on-chain data while the site runs on a test network. */
export const TestnetBadge = () =>
  IS_TESTNET ? (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-warning/50 text-warning">Testnet</Badge>
  ) : null;
