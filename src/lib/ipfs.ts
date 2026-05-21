// Lightweight IPFS CID validators. Regex-only; we do not resolve the CID on the network.
// - CIDv0: base58btc, always starts with "Qm", 46 chars total.
// - CIDv1: typically base32 ("b...", >=50 chars) or base58btc ("z...", >=48 chars).

const CID_V0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1_B32 = /^b[a-z2-7]{50,}$/;
const CID_V1_B58 = /^z[1-9A-HJ-NP-Za-km-z]{48,}$/;

export function isValidCID(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return CID_V0.test(v) || CID_V1_B32.test(v) || CID_V1_B58.test(v);
}

/** Returns a human error message when the value is non-empty and not a CID. */
export function cidError(value: string): string | null {
  if (!value || !value.trim()) return null;
  return isValidCID(value)
    ? null
    : "Must be a valid IPFS CID (e.g. Qm… for v0 or bafy… for v1).";
}