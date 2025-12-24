import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketDataRequest {
  symbols: string[];
}

interface SymbolPrice {
  id: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
  lastUpdated: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json() as MarketDataRequest;

    if (!symbols || symbols.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Symbols are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching market data for symbols:', symbols.join(', '));

    const symbolList = symbols.join(', ');
    const query = `Get the current real-time stock/commodity prices for these symbols: ${symbolList}. 
    For each symbol provide: current price in USD, price change from previous close, percentage change, day high, day low, and trading volume.
    Format response as JSON array with objects containing: id (ticker symbol), name (full name), price (number), change (number - positive or negative), changePercent (number), high (number), low (number), volume (string with K/M/B suffix).
    Only return the JSON array, no other text.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial data API. Return only valid JSON arrays with market data. No explanations or markdown, just raw JSON.' 
          },
          { role: 'user', content: query }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Perplexity API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error?.message || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = data.choices?.[0]?.message?.content || '';
    console.log('Raw response:', content);

    // Try to parse the JSON from the response
    let marketData: SymbolPrice[] = [];
    try {
      // Extract JSON array from response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        // Sanitize JSON: remove + signs before numbers (invalid JSON but sometimes returned by AI)
        let sanitizedJson = jsonMatch[0].replace(/:\s*\+(\d)/g, ': $1');
        marketData = JSON.parse(sanitizedJson);
        // Add lastUpdated timestamp
        marketData = marketData.map(item => ({
          ...item,
          lastUpdated: new Date().toISOString()
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse market data JSON:', parseError);
      console.error('Raw content that failed to parse:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse market data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed market data:', marketData.length, 'symbols');

    return new Response(
      JSON.stringify({
        success: true,
        data: marketData,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in market-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
