import { supabase } from '@/integrations/supabase/client';

export type PerplexityResponse = {
  success: boolean;
  error?: string;
  answer?: string;
  citations?: string[];
  model?: string;
};

export const perplexityApi = {
  async search(query: string, model: string = 'sonar'): Promise<PerplexityResponse> {
    const { data, error } = await supabase.functions.invoke('perplexity-search', {
      body: { query, model },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
