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
  unit?: string;
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
    const query = `Get the current real-time prices for these financial instruments: ${symbolList}. 
    
    For stocks (AAPL, GOOGL, MSFT, AMZN, TSLA, NVDA): provide current price in USD, price change from previous close, percentage change, day high, day low, and trading volume.
    
    For commodities (XAU = Gold, XAG = Silver): provide current spot price in USD per troy ounce, price change, percentage change, day high, day low. Use "N/A" for volume.
    
    IMPORTANT: Return ONLY a valid JSON array. No markdown, no code blocks, no explanations.
    Each object must have: id (ticker), name (full name), price (number), change (number), changePercent (number), high (number), low (number), volume (string), unit (string - "USD" for stocks, "USD/oz" for commodities).
    
    Example format:
    [{"id":"AAPL","name":"Apple Inc.","price":175.50,"change":2.30,"changePercent":1.33,"high":176.20,"low":173.80,"volume":"52.3M","unit":"USD"},{"id":"XAU","name":"Gold Spot","price":2650.80,"change":15.40,"changePercent":0.58,"high":2658.00,"low":2635.00,"volume":"N/A","unit":"USD/oz"}]`;

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
            content: 'You are a financial data API. Return ONLY valid JSON arrays with market data. Never include markdown formatting, code blocks, or any text outside the JSON array. All numbers must be valid JSON numbers (no + prefix).' 
          },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
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
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        // Sanitize JSON: remove + signs before numbers (invalid JSON but sometimes returned by AI)
        let sanitizedJson = jsonMatch[0]
          .replace(/:\s*\+(\d)/g, ': $1')
          .replace(/,\s*\+(\d)/g, ', $1')
          .replace(/\[\s*\+(\d)/g, '[ $1');
        
        console.log('Sanitized JSON:', sanitizedJson);
        marketData = JSON.parse(sanitizedJson);
        
        // Add lastUpdated timestamp and ensure all fields exist
        marketData = marketData.map(item => ({
          id: item.id?.toUpperCase() || '',
          name: item.name || '',
          price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
          change: typeof item.change === 'number' ? item.change : parseFloat(String(item.change)) || 0,
          changePercent: typeof item.changePercent === 'number' ? item.changePercent : parseFloat(String(item.changePercent)) || 0,
          high: typeof item.high === 'number' ? item.high : parseFloat(String(item.high)) || 0,
          low: typeof item.low === 'number' ? item.low : parseFloat(String(item.low)) || 0,
          volume: item.volume || 'N/A',
          unit: item.unit || 'USD',
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
