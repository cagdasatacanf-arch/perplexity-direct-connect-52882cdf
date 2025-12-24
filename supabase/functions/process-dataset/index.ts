import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataRow {
  [key: string]: string | number | null;
}

interface AggregatedData {
  date: string;
  symbol?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  avg_price?: number;
  price_change?: number;
  price_change_percent?: number;
  data_points: number;
}

// Parse CSV content
function parseCSV(content: string): DataRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: DataRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) continue;
    
    const row: DataRow = {};
    headers.forEach((header, index) => {
      const value = values[index];
      const numValue = parseFloat(value);
      row[header] = isNaN(numValue) ? value : numValue;
    });
    rows.push(row);
  }
  
  return rows;
}

// Parse JSON content
function parseJSON(content: string): DataRow[] {
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
}

// Detect date column
function detectDateColumn(rows: DataRow[]): string | null {
  if (rows.length === 0) return null;
  
  const firstRow = rows[0];
  const datePatterns = [/date/i, /time/i, /timestamp/i, /day/i, /period/i];
  
  for (const key of Object.keys(firstRow)) {
    for (const pattern of datePatterns) {
      if (pattern.test(key)) return key;
    }
  }
  
  // Try to detect by value format
  for (const key of Object.keys(firstRow)) {
    const value = String(firstRow[key]);
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) {
      return key;
    }
  }
  
  return null;
}

// Detect numeric columns for aggregation
function detectNumericColumns(rows: DataRow[]): string[] {
  if (rows.length === 0) return [];
  
  const firstRow = rows[0];
  return Object.keys(firstRow).filter(key => {
    const value = firstRow[key];
    return typeof value === 'number' || !isNaN(parseFloat(String(value)));
  });
}

// Aggregate data by date
function aggregateByDate(
  rows: DataRow[], 
  dateColumn: string,
  numericColumns: string[]
): AggregatedData[] {
  const grouped: { [date: string]: DataRow[] } = {};
  
  // Group by date
  for (const row of rows) {
    const dateValue = String(row[dateColumn] || '');
    const dateKey = dateValue.split('T')[0].split(' ')[0]; // Extract date part
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(row);
  }
  
  // Aggregate
  const aggregated: AggregatedData[] = [];
  
  for (const [date, dateRows] of Object.entries(grouped)) {
    if (!date || date === 'undefined' || date === 'null') continue;
    
    const agg: AggregatedData = {
      date,
      data_points: dateRows.length,
    };
    
    // Find price-like columns
    const priceCol = numericColumns.find(c => /price|close|value/i.test(c));
    const openCol = numericColumns.find(c => /open/i.test(c));
    const highCol = numericColumns.find(c => /high/i.test(c));
    const lowCol = numericColumns.find(c => /low/i.test(c));
    const volumeCol = numericColumns.find(c => /volume|qty|quantity/i.test(c));
    const symbolCol = Object.keys(dateRows[0]).find(c => /symbol|ticker|stock/i.test(c));
    
    if (symbolCol) {
      agg.symbol = String(dateRows[0][symbolCol]);
    }
    
    const values = dateRows.map(r => parseFloat(String(r[priceCol || numericColumns[0]] || 0))).filter(v => !isNaN(v));
    
    if (values.length > 0) {
      agg.open = openCol ? parseFloat(String(dateRows[0][openCol])) : values[0];
      agg.high = highCol ? Math.max(...dateRows.map(r => parseFloat(String(r[highCol])))) : Math.max(...values);
      agg.low = lowCol ? Math.min(...dateRows.map(r => parseFloat(String(r[lowCol])))) : Math.min(...values);
      agg.close = priceCol ? parseFloat(String(dateRows[dateRows.length - 1][priceCol])) : values[values.length - 1];
      agg.avg_price = values.reduce((a, b) => a + b, 0) / values.length;
    }
    
    if (volumeCol) {
      agg.volume = dateRows.reduce((sum, r) => sum + parseFloat(String(r[volumeCol] || 0)), 0);
    }
    
    aggregated.push(agg);
  }
  
  // Sort by date
  aggregated.sort((a, b) => a.date.localeCompare(b.date));
  
  return aggregated;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { datasetId } = await req.json();
    
    if (!datasetId) {
      throw new Error('datasetId is required');
    }

    console.log(`Processing dataset: ${datasetId}`);

    // Get dataset metadata
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .single();

    if (fetchError || !dataset) {
      throw new Error(`Dataset not found: ${fetchError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('datasets')
      .update({ status: 'processing' })
      .eq('id', datasetId);

    console.log(`Downloading file: ${dataset.file_name}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('datasets')
      .download(dataset.file_name);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const content = await fileData.text();
    console.log(`File size: ${content.length} bytes`);

    // Parse file content
    let rows: DataRow[];
    if (dataset.file_type === 'csv') {
      rows = parseCSV(content);
    } else {
      rows = parseJSON(content);
    }

    console.log(`Parsed ${rows.length} rows`);

    if (rows.length === 0) {
      throw new Error('No data found in file');
    }

    // Detect columns
    const dateColumn = detectDateColumn(rows);
    const numericColumns = detectNumericColumns(rows);

    console.log(`Date column: ${dateColumn}, Numeric columns: ${numericColumns.join(', ')}`);

    if (!dateColumn) {
      throw new Error('Could not detect date column. Please ensure your data has a date/time column.');
    }

    // Aggregate data
    const aggregated = aggregateByDate(rows, dateColumn, numericColumns);
    console.log(`Aggregated to ${aggregated.length} daily summaries`);

    // Calculate price changes
    for (let i = 1; i < aggregated.length; i++) {
      const prev = aggregated[i - 1];
      const curr = aggregated[i];
      if (prev.close && curr.close) {
        curr.price_change = curr.close - prev.close;
        curr.price_change_percent = ((curr.close - prev.close) / prev.close) * 100;
      }
    }

    // Delete existing summaries for this dataset
    await supabase
      .from('dataset_summaries')
      .delete()
      .eq('dataset_id', datasetId);

    // Insert summaries in batches
    const batchSize = 500;
    for (let i = 0; i < aggregated.length; i += batchSize) {
      const batch = aggregated.slice(i, i + batchSize).map(agg => ({
        dataset_id: datasetId,
        date: agg.date,
        symbol: agg.symbol,
        open: agg.open,
        high: agg.high,
        low: agg.low,
        close: agg.close,
        volume: agg.volume,
        avg_price: agg.avg_price,
        price_change: agg.price_change,
        price_change_percent: agg.price_change_percent,
        data_points: agg.data_points,
      }));

      const { error: insertError } = await supabase
        .from('dataset_summaries')
        .insert(batch);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to insert summaries: ${insertError.message}`);
      }
    }

    // Update dataset status
    await supabase
      .from('datasets')
      .update({
        status: 'completed',
        row_count: rows.length,
        date_column: dateColumn,
        value_columns: numericColumns,
      })
      .eq('id', datasetId);

    console.log(`Successfully processed dataset ${datasetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        rowCount: rows.length,
        summaryCount: aggregated.length,
        dateColumn,
        numericColumns,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Processing error:', errorMessage);

    // Try to update dataset status to failed
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const body = await req.clone().json().catch(() => ({}));
      if (body.datasetId) {
        await supabase
          .from('datasets')
          .update({ 
            status: 'failed',
            error_message: errorMessage 
          })
          .eq('id', body.datasetId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
