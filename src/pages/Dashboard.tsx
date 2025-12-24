import { useState, useMemo, useCallback } from 'react';
import { ThemeProvider } from 'next-themes';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SymbolSidebar } from '@/components/dashboard/SymbolSidebar';
import { ChartToolbar } from '@/components/dashboard/ChartToolbar';
import { PriceChart } from '@/components/dashboard/PriceChart';
import { StatsPanel } from '@/components/dashboard/StatsPanel';
import { AIResultsPanel } from '@/components/dashboard/AIResultsPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { perplexityApi, type PerplexityResponse } from '@/lib/api/perplexity';
import {
  sampleSymbols,
  generateOHLCData,
  calculateStats,
  filterByPeriod,
} from '@/lib/sampleData';

const Dashboard = () => {
  // State
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedPeriod, setSelectedPeriod] = useState('3M');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('line');
  const [indicators, setIndicators] = useState<string[]>(['MA20']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // AI State
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiQuery, setAIQuery] = useState<string>();
  const [aiResult, setAIResult] = useState<PerplexityResponse>();

  // Get current symbol data
  const currentSymbol = useMemo(() => 
    sampleSymbols.find(s => s.id === selectedSymbol) || sampleSymbols[0],
    [selectedSymbol]
  );

  // Generate chart data
  const fullData = useMemo(() => 
    generateOHLCData(currentSymbol.price, 365),
    [currentSymbol.price]
  );

  const chartData = useMemo(() => 
    filterByPeriod(fullData, selectedPeriod),
    [fullData, selectedPeriod]
  );

  const stats = useMemo(() => 
    calculateStats(chartData),
    [chartData]
  );

  // Handlers
  const handleSymbolSelect = useCallback((id: string) => {
    setSelectedSymbol(id);
    setSidebarOpen(false);
  }, []);

  const handleIndicatorToggle = useCallback((indicator: string) => {
    setIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  }, []);

  const handleAISearch = useCallback(async (query: string) => {
    setAIQuery(query);
    setAIPanelOpen(true);
    setAILoading(true);

    try {
      const response = await perplexityApi.search(query);
      
      if (response.success) {
        setAIResult(response);
      } else {
        toast.error(response.error || 'Failed to get AI response');
      }
    } catch (error) {
      toast.error('Failed to connect to AI service');
    } finally {
      setAILoading(false);
    }
  }, []);

  const handleExportPNG = useCallback(() => {
    toast.success('Chart exported as PNG');
  }, []);

  const handleExportCSV = useCallback(() => {
    toast.success('Data exported as CSV');
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="h-screen flex flex-col bg-background">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <SymbolSidebar
            className="hidden lg:flex"
            symbols={sampleSymbols}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSymbolSelect}
            onAISearch={handleAISearch}
            isAILoading={aiLoading}
          />

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72">
              <SymbolSidebar
                symbols={sampleSymbols}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={handleSymbolSelect}
                onAISearch={handleAISearch}
                isAILoading={aiLoading}
              />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <ChartToolbar
              symbol={currentSymbol}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              chartType={chartType}
              onChartTypeChange={(type) => setChartType(type as typeof chartType)}
              indicators={indicators}
              onIndicatorToggle={handleIndicatorToggle}
              onExportPNG={handleExportPNG}
              onExportCSV={handleExportCSV}
            />
            
            <div className="flex-1 overflow-auto p-4">
              <PriceChart
                data={chartData}
                chartType={chartType}
                indicators={indicators}
              />
              
              <StatsPanel stats={stats} className="mt-4" />
            </div>
          </main>

          {/* AI Results Panel */}
          <AIResultsPanel
            isOpen={aiPanelOpen}
            onClose={() => setAIPanelOpen(false)}
            query={aiQuery}
            answer={aiResult?.answer}
            citations={aiResult?.citations}
            isLoading={aiLoading}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Dashboard;
