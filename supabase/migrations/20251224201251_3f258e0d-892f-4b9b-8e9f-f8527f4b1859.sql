-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create datasets metadata table
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'json')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  row_count INTEGER,
  date_column TEXT,
  value_columns TEXT[],
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aggregated summaries table
CREATE TABLE public.dataset_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symbol TEXT,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume NUMERIC,
  avg_price NUMERIC,
  price_change NUMERIC,
  price_change_percent NUMERIC,
  data_points INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_dataset_summaries_dataset_id ON public.dataset_summaries(dataset_id);
CREATE INDEX idx_dataset_summaries_date ON public.dataset_summaries(date);
CREATE INDEX idx_dataset_summaries_symbol ON public.dataset_summaries(symbol);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_summaries ENABLE ROW LEVEL SECURITY;

-- Public policies for demo
CREATE POLICY "Allow public read datasets" ON public.datasets FOR SELECT USING (true);
CREATE POLICY "Allow public insert datasets" ON public.datasets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update datasets" ON public.datasets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete datasets" ON public.datasets FOR DELETE USING (true);

CREATE POLICY "Allow public read summaries" ON public.dataset_summaries FOR SELECT USING (true);
CREATE POLICY "Allow public insert summaries" ON public.dataset_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete summaries" ON public.dataset_summaries FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for datasets
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', true);

-- Storage policies
CREATE POLICY "Allow public upload to datasets bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'datasets');
CREATE POLICY "Allow public read from datasets bucket" ON storage.objects FOR SELECT USING (bucket_id = 'datasets');
CREATE POLICY "Allow public delete from datasets bucket" ON storage.objects FOR DELETE USING (bucket_id = 'datasets');