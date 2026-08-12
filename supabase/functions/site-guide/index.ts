// ARIGI site guide: a conversational assistant that helps users navigate the app.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_MAP = `
PUBLIC PAGES
- / — Home / landing page
- /about — Our Story (who ARIGI is, provenance & fees FAQ)
- /marketplace — Browse and filter whisky casks for sale
- /cask/:id — Individual cask detail page (specs, provenance, buy / make an offer)
- /distillery/:id — Public distillery profile
- /help — Help centre & FAQ (searchable)
- /docs — Documentation
- /consumer-journey — How buying a cask works, step by step
- /auth — Sign in or create an account

SIGNED-IN BUYER PAGES
- /portfolio — Casks you own, maturation tracking and valuation
- /transactions — Purchase and resale history, CSV export
- /offers — Offers you have made or received
- /wishlist — Casks you are tracking
- /comparison — Compare up to 4 casks side by side
- /insights — Platform insights and analytics
- /market-insights — AI price tracker
- /notifications — Your alerts
- /profile — Your profile and verification details
- /settings — Account settings, currency, theme, notification preferences

DISTILLERY PAGES (distillery accounts)
- /distillery — Distillery dashboard
- /distillery/casks — Manage your cask inventory
- /distillery/casks/new — List a new cask (requires full cask specs for the NFT record)
- /distillery/analytics — Sales analytics
- /distillery/onboarding — Apply to become a verified distillery

WAREHOUSE PAGES (bonded warehouse / facilitator accounts)
- /warehouse — Warehouse dashboard
- /warehouse/casks/new — List a cask held in your warehouse
- /warehouse/onboarding — Apply to become a verified warehouse
`;

const SYSTEM_PROMPT = `You are the ARIGI Guide, a friendly in-app assistant for ARIGI — a platform for buying, owning and reselling whisky casks with blockchain-verified provenance.

Your job is to help people find their way around the site and understand how it works.

Rules:
- Be concise. Two to four short sentences, or a short bullet list.
- Always point people to a concrete page using a markdown link with the app's internal path, e.g. [the marketplace](/marketplace). Only use paths from the site map below — never invent URLs.
- If a page requires signing in and the user is not signed in, say so and link [sign in](/auth).
- Never give investment advice, projected returns, ROI figures or growth percentages. If asked, explain that ARIGI does not provide return projections and point to [Our Story](/about) and the [help centre](/help).
- If you don't know something, say so and link to the [help centre](/help).
- Never discuss internal implementation, database tables or API keys.

SITE MAP:
${SITE_MAP}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const context = typeof body?.context === 'string' ? body.context : '';

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmed = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        stream: true,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT: ${context || 'unknown page'}` },
          ...trimmed,
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error('AI gateway error', status, errorText);
      const message =
        status === 429
          ? 'Too many requests right now. Please try again in a moment.'
          : status === 402
            ? 'AI credits are exhausted. Please contact support.'
            : 'The assistant is unavailable right now.';
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('site-guide error', error);
    return new Response(JSON.stringify({ error: 'Unexpected error in the assistant.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
