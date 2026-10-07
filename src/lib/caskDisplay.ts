import caskPlaceholder from '@/assets/cask-placeholder.jpg';
import caskSherry from '@/assets/cask-sherry.jpg';
import caskWine from '@/assets/cask-wine.jpg';
import caskBourbon from '@/assets/cask-bourbon.jpg';
import singleCask from '@/assets/single-cask.jpg';
import caskDetail from '@/assets/cask-detail.jpg';

/** A real tx hash: 0x + 64 hex chars, not mostly zero padding. */
export const isRealTxHash = (hash?: string | null): hash is string => {
  if (!hash) return false;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return false;
  const zeros = (hash.slice(2).match(/0/g) || []).length;
  return zeros < 48;
};

/** On-chain only when an NFT certificate exists and the hash is real. */
export const isCaskOnChain = (c: { nft_token_id?: number | null; blockchain_hash?: string | null }) =>
  c.nft_token_id != null && isRealTxHash(c.blockchain_hash);

export const polygonTxUrl = (hash: string) => `https://polygonscan.com/tx/${hash}`;

export const caskAgeYears = (distillationDate?: string | null): number | null => {
  if (!distillationDate) return null;
  const d = new Date(distillationDate);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
};

/** Name with age computed from the distillation date, e.g. "Speyside Gold 23 Year". */
export const caskDisplayName = (name: string, distillationDate?: string | null) => {
  const base = name.replace(/\s+\d+\s+Years?(\s+Old)?$/i, '');
  const age = caskAgeYears(distillationDate);
  return age && age > 0 ? `${base} ${age} Year` : base;
};

/** Default image by cask type, used when a cask has no uploaded photo. */
export const defaultCaskImage = (typeName?: string | null, seed = '') => {
  const t = (typeName || '').toLowerCase();
  if (t.includes('sherry')) return caskSherry;
  if (t.includes('port') || t.includes('wine') || t.includes('madeira')) return caskWine;
  if (t.includes('bourbon') || t.includes('american')) return caskBourbon;
  const pool = [caskPlaceholder, singleCask, caskDetail];
  let h = 0;
  for (const ch of seed + t) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
};

/** Never show a seller's full name publicly: first name + last initial. */
export const publicSellerName = (first?: string | null, last?: string | null) => {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!f) return 'Verified owner';
  return l ? `${f} ${l[0].toUpperCase()}.` : f;
};
