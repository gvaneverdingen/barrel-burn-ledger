// Shared label maps and option lists for the extended cask specification enums.
// Keys match the Postgres enums defined in the migration; labels are human-friendly.

export const SPIRIT_TYPE_OPTIONS = [
  { value: "single_malt", label: "Single Malt" },
  { value: "single_grain", label: "Single Grain" },
  { value: "blended_malt", label: "Blended Malt" },
  { value: "blended_grain", label: "Blended Grain" },
  { value: "blended_whisky", label: "Blended Whisky" },
  { value: "bourbon", label: "Bourbon" },
  { value: "rye", label: "Rye" },
  { value: "corn_whiskey", label: "Corn Whiskey" },
  { value: "tennessee_whiskey", label: "Tennessee Whiskey" },
  { value: "irish_pot_still", label: "Irish Pot Still" },
  { value: "rum", label: "Rum" },
  { value: "cognac", label: "Cognac" },
  { value: "armagnac", label: "Armagnac" },
  { value: "brandy", label: "Brandy" },
  { value: "tequila", label: "Tequila" },
  { value: "mezcal", label: "Mezcal" },
  { value: "other", label: "Other" },
] as const;

export const WOOD_SPECIES_OPTIONS = [
  { value: "american_oak", label: "American Oak (Q. alba)" },
  { value: "european_oak", label: "European Oak (Q. robur)" },
  { value: "spanish_oak", label: "Spanish Oak" },
  { value: "french_oak", label: "French Oak" },
  { value: "hungarian_oak", label: "Hungarian Oak" },
  { value: "japanese_mizunara", label: "Japanese Mizunara" },
  { value: "chestnut", label: "Chestnut" },
  { value: "cherry", label: "Cherry" },
  { value: "other", label: "Other" },
] as const;

export const FILL_GENERATION_OPTIONS = [
  { value: "virgin", label: "Virgin" },
  { value: "first_fill", label: "First Fill" },
  { value: "refill", label: "Refill" },
  { value: "second_fill", label: "Second Fill" },
  { value: "third_fill", label: "Third Fill" },
  { value: "fourth_fill_plus", label: "Fourth Fill+" },
  { value: "rejuvenated", label: "Rejuvenated" },
] as const;

export const PREVIOUS_CONTENTS_OPTIONS = [
  { value: "virgin_oak", label: "Virgin Oak" },
  { value: "ex_bourbon", label: "Ex-Bourbon" },
  { value: "ex_sherry_oloroso", label: "Ex-Sherry Oloroso" },
  { value: "ex_sherry_px", label: "Ex-Sherry PX" },
  { value: "ex_sherry_fino", label: "Ex-Sherry Fino" },
  { value: "ex_sherry_amontillado", label: "Ex-Sherry Amontillado" },
  { value: "ex_sherry_manzanilla", label: "Ex-Sherry Manzanilla" },
  { value: "ex_sherry_palo_cortado", label: "Ex-Sherry Palo Cortado" },
  { value: "ex_port_ruby", label: "Ex-Port Ruby" },
  { value: "ex_port_tawny", label: "Ex-Port Tawny" },
  { value: "ex_port_white", label: "Ex-Port White" },
  { value: "ex_wine_sauternes", label: "Ex-Wine Sauternes" },
  { value: "ex_wine_bordeaux", label: "Ex-Wine Bordeaux" },
  { value: "ex_wine_burgundy", label: "Ex-Wine Burgundy" },
  { value: "ex_wine_tokaji", label: "Ex-Wine Tokaji" },
  { value: "ex_wine_other", label: "Ex-Wine (Other)" },
  { value: "ex_rum", label: "Ex-Rum" },
  { value: "ex_cognac", label: "Ex-Cognac" },
  { value: "ex_madeira", label: "Ex-Madeira" },
  { value: "ex_marsala", label: "Ex-Marsala" },
  { value: "str", label: "STR (Shaved-Toasted-Recharred)" },
  { value: "other", label: "Other" },
] as const;

export const TOAST_LEVEL_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "medium_plus", label: "Medium+" },
  { value: "heavy", label: "Heavy" },
] as const;

export const DUTY_STATUS_OPTIONS = [
  { value: "under_bond", label: "Under Bond" },
  { value: "duty_paid", label: "Duty Paid" },
] as const;

export const TRANSFER_TYPE_OPTIONS = [
  { value: "re_rack", label: "Re-rack" },
  { value: "marrying", label: "Marrying" },
  { value: "finishing_transfer", label: "Finishing Transfer" },
  { value: "warehouse_move", label: "Warehouse Move" },
  { value: "other", label: "Other" },
] as const;

type Opt = { value: string; label: string };
const toMap = (opts: readonly Opt[]) =>
  Object.fromEntries(opts.map((o) => [o.value, o.label])) as Record<string, string>;

export const SPIRIT_TYPE_LABELS = toMap(SPIRIT_TYPE_OPTIONS);
export const WOOD_SPECIES_LABELS = toMap(WOOD_SPECIES_OPTIONS);
export const FILL_GENERATION_LABELS = toMap(FILL_GENERATION_OPTIONS);
export const PREVIOUS_CONTENTS_LABELS = toMap(PREVIOUS_CONTENTS_OPTIONS);
export const TOAST_LEVEL_LABELS = toMap(TOAST_LEVEL_OPTIONS);
export const DUTY_STATUS_LABELS = toMap(DUTY_STATUS_OPTIONS);
export const TRANSFER_TYPE_LABELS = toMap(TRANSFER_TYPE_OPTIONS);

/**
 * Computes an angel's share rate (percent per year) from a sorted regauge series.
 * Returns null when fewer than two regauges exist or duration is too small.
 */
export function computeAngelsShareRate(
  regauges: Array<{ regauge_date: string; rla_liters: number }>,
  originalLpa: number | null | undefined,
) {
  if (!regauges || regauges.length === 0) return null;
  const sorted = [...regauges].sort(
    (a, b) => new Date(a.regauge_date).getTime() - new Date(b.regauge_date).getTime(),
  );
  const first = originalLpa
    ? { regauge_date: sorted[0].regauge_date, rla_liters: originalLpa }
    : sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === last) return null;
  const years =
    (new Date(last.regauge_date).getTime() - new Date(first.regauge_date).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  if (years <= 0.05) return null;
  const lossPct = ((first.rla_liters - last.rla_liters) / first.rla_liters) * 100;
  return lossPct / years;
}