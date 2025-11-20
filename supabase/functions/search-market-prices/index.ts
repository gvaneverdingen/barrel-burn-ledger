import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Market price search query:', query);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch actual cask data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all available casks with their details
    const { data: casks, error: casksError } = await supabase
      .from('casks')
      .select(`
        *,
        distilleries (name, location, verified),
        cask_types (name, capacity_liters)
      `)
      .eq('available_for_sale', true);

    if (casksError) {
      console.error('Error fetching casks:', casksError);
      throw casksError;
    }

    // Fetch secondary market listings
    const { data: salesListings, error: salesError } = await supabase
      .from('cask_sales')
      .select(`
        *,
        cask_ownership (
          acquisition_price,
          casks (
            spirit_name,
            cask_number,
            alcohol_percentage,
            distilleries (name, location)
          )
        )
      `)
      .eq('status', 'active');

    if (salesError) {
      console.error('Error fetching sales listings:', salesError);
    }

    // Prepare market data for AI analysis
    const marketData = {
      primaryMarket: casks?.map(c => ({
        spirit: c.spirit_name,
        caskNumber: c.cask_number,
        distillery: c.distilleries?.name,
        location: c.distilleries?.location,
        verified: c.distilleries?.verified,
        pricePerLiter: c.price_per_liter,
        totalPrice: c.total_price,
        volume: c.current_volume_liters,
        abv: c.alcohol_percentage,
        age: c.distillation_date ? new Date().getFullYear() - new Date(c.distillation_date).getFullYear() : null,
        caskType: c.cask_types?.name,
      })) || [],
      secondaryMarket: salesListings?.map(s => ({
        spirit: s.cask_ownership?.casks?.spirit_name,
        caskNumber: s.cask_ownership?.casks?.cask_number,
        distillery: s.cask_ownership?.casks?.distilleries?.name,
        askingPricePerLiter: s.asking_price_per_liter,
        totalAskingPrice: s.total_asking_price,
        volumeForSale: s.volume_for_sale_liters,
        acquisitionPrice: s.cask_ownership?.acquisition_price,
        roi: s.cask_ownership?.acquisition_price 
          ? ((s.total_asking_price - s.cask_ownership.acquisition_price) / s.cask_ownership.acquisition_price) * 100
          : null,
      })) || [],
    };

    console.log('Market data prepared:', {
      primaryCount: marketData.primaryMarket.length,
      secondaryCount: marketData.secondaryMarket.length,
    });

    // Call Lovable AI for intelligent market analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert whisky cask investment analyst. Analyze market data and provide insights on cask prices, trends, and investment opportunities. 
            
When answering queries:
- Compare prices across different distilleries, regions, and cask types
- Identify value opportunities and overpriced casks
- Provide price ranges and averages
- Highlight ROI trends in the secondary market
- Give specific recommendations based on the user's query
- Use actual data from the provided market information
- Format responses clearly with bullet points and numbers`,
          },
          {
            role: 'user',
            content: `Based on this current market data, please answer: "${query}"

Market Data:
Primary Market (${marketData.primaryMarket.length} casks):
${JSON.stringify(marketData.primaryMarket, null, 2)}

Secondary Market (${marketData.secondaryMarket.length} listings):
${JSON.stringify(marketData.secondaryMarket, null, 2)}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    console.log('AI analysis completed successfully');

    return new Response(
      JSON.stringify({
        analysis,
        marketSummary: {
          totalPrimaryCasks: marketData.primaryMarket.length,
          totalSecondaryListings: marketData.secondaryMarket.length,
          avgPrimaryPrice: marketData.primaryMarket.reduce((sum, c) => sum + (c.pricePerLiter || 0), 0) / marketData.primaryMarket.length || 0,
          avgSecondaryPrice: marketData.secondaryMarket.reduce((sum, s) => sum + (s.askingPricePerLiter || 0), 0) / marketData.secondaryMarket.length || 0,
          avgROI: marketData.secondaryMarket.reduce((sum, s) => sum + (s.roi || 0), 0) / marketData.secondaryMarket.filter(s => s.roi).length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in search-market-prices function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
