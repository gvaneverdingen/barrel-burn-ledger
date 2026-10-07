import { supabase } from '@/integrations/supabase/client';
import { publicSellerName } from '@/lib/caskDisplay';

/**
 * Single source of truth for "casks for sale": priced primary casks that are
 * available_for_sale, plus active resale listings (signed-in users only, as
 * resale rows are not readable anonymously). Used by Marketplace and Home.
 */
export const fetchMarketplaceListings = async (signedIn: boolean): Promise<any[]> => {
  const { data: primaryCasks, error: primaryError } = await supabase
    .from('casks')
    .select(`
      *,
      distilleries ( name, location, verified, profile_id ),
      cask_types ( name, capacity_liters )
    `)
    .eq('available_for_sale', true)
    .order('created_at', { ascending: false });
  if (primaryError) throw primaryError;

  const { data: secondaryListings, error: secondaryError } = signedIn
    ? await supabase
        .from('cask_sales')
        .select(`
          id, cask_id, seller_id, asking_price_per_liter, total_asking_price,
          volume_for_sale_liters, status, notes, listing_date, last_gauging_date, created_at,
          casks (
            spirit_name, cask_number, distillation_date, alcohol_percentage, blockchain_hash,
            nft_token_id, warehouse_location, tasting_notes, region, spirit_type, distillery_id,
            distilleries ( name, location, verified ),
            cask_types ( name, capacity_liters )
          ),
          profiles!cask_sales_seller_id_fkey ( first_name, last_name )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    : { data: [], error: null };
  if (secondaryError) throw secondaryError;

  const primary = (primaryCasks || [])
    .filter((c: any) => c.price_per_liter != null && c.total_price != null && c.current_volume_liters != null && c.alcohol_percentage != null)
    .map((cask: any) => ({
      ...cask,
      cask_id: cask.id,
      is_resale: false,
      seller_id: cask.distilleries?.profile_id,
    }));

  const secondary = ((secondaryListings as any[]) || [])
    .filter((l) => l.casks && l.casks.spirit_name && l.casks.cask_number)
    .map((l) => {
      const c = l.casks;
      return {
        id: l.id,
        cask_id: l.cask_id,
        spirit_name: c.spirit_name,
        cask_number: c.cask_number,
        distillation_date: c.distillation_date || '',
        current_volume_liters: l.volume_for_sale_liters,
        alcohol_percentage: c.alcohol_percentage || null,
        price_per_liter: l.asking_price_per_liter,
        total_price: l.total_asking_price,
        warehouse_location: c.warehouse_location,
        tasting_notes: c.tasting_notes,
        region: c.region ?? null,
        spirit_type: c.spirit_type ?? null,
        distillery_id: c.distillery_id,
        created_at: l.created_at,
        updated_at: l.created_at,
        distilleries: c.distilleries,
        cask_types: c.cask_types,
        is_resale: true,
        seller_id: l.seller_id,
        blockchain_hash: c.blockchain_hash,
        nft_token_id: c.nft_token_id,
        seller_name: publicSellerName(l.profiles?.first_name, l.profiles?.last_name),
        last_gauging_date: l.last_gauging_date,
      };
    });

  const all = [...primary, ...secondary];

  // Primary uploaded photo per cask, if any
  const ids = Array.from(new Set(all.map((l) => l.cask_id)));
  if (ids.length) {
    const { data: imgs } = await supabase
      .from('cask_images')
      .select('cask_id, image_url')
      .in('cask_id', ids)
      .eq('is_primary', true);
    const map = new Map((imgs || []).map((i: any) => [i.cask_id, i.image_url]));
    all.forEach((l) => (l.image_url = map.get(l.cask_id) ?? null));
  }
  return all;
};
