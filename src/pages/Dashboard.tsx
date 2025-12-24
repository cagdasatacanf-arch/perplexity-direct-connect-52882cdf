import { useState, useMemo, useCallback, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SymbolSidebar } from '@/components/dashboard/SymbolSidebar';
import { ChartToolbar } from '@/components/dashboard/ChartToolbar';
import { PriceChart } from '@/components/dashboard/PriceChart';
import { StatsPanel } from '@/components/dashboard/StatsPanel';
import { AIResultsPanel } from '@/components/dashboard/AIResultsPanel';
import { PriceAlertDialog } from '@/components/dashboard/PriceAlertDialog';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { CommodityCards } from '@/components/dashboard/CommodityCards';
import { AIMarketAnalysis } from '@/components/dashboard/AIMarketAnalysis';
import { PortfolioPanel } from '@/components/dashboard/PortfolioPanel';
import { CorrelationMatrix } from '@/components/dashboard/CorrelationMatrix';
import { MarketInsightsPanel } from '@/components/dashboard/MarketInsightsPanel';
import { HistoricalSidebar } from '@/components/dashboard/HistoricalSidebar';
import { FullscreenChart } from '@/components/dashboard/FullscreenChart';
import { DataImportPanel } from '@/components/dashboard/DataImportPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { perplexityApi, type PerplexityResponse } from '@/lib/api/perplexity';
import { useAlerts } from '@/hooks/useAlerts';
import { useMarketData } from '@/hooks/useMarketData';
import { exportChartAsPNG, exportDataAsCSV } from '@/lib/exportUtils';
import {
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
  const [historicalSidebarOpen, setHistoricalSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real-time market data
  const { symbols: marketSymbols, isLoading: marketLoading, lastUpdated, refresh: refreshMarket } = useMarketData();
  
  // AI State
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiQuery, setAIQuery] = useState<string>();
  const [aiResult, setAIResult] = useState<PerplexityResponse>();

  // Alerts
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [portfolioPanelOpen, setPortfolioPanelOpen] = useState(false);
  const [marketInsightsOpen, setMarketInsightsOpen] = useState(false);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const {
    alerts,
    triggeredAlerts,
    addAlert,
    removeAlert,
    triggerAlert,
    clearTriggered,
    checkAlerts,
  } = useAlerts();

  // Get current symbol data from live market data
  const currentSymbol = useMemo(() => 
    marketSymbols.find(s => s.id === selectedSymbol) || marketSymbols[0],
    [selectedSymbol, marketSymbols]
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

  // Separate commodities from stocks
  const commodities = useMemo(() => 
    marketSymbols.filter(s => s.category === 'metal'),
    [marketSymbols]
  );

  // Check for triggered alerts when symbol changes
  useEffect(() => {
    const triggered = checkAlerts(selectedSymbol, currentSymbol.price);
    triggered.forEach((alert) => {
      triggerAlert(alert.id, currentSymbol.price);
      toast.success(
        `Alert triggered: ${alert.symbolId} is now ${alert.condition === 'above' ? 'above' : 'below'} $${alert.targetPrice.toFixed(2)}`,
        {
          description: `Current price: $${currentSymbol.price.toFixed(2)}`,
          duration: 5000,
        }
      );
    });
  }, [selectedSymbol, currentSymbol.price, checkAlerts, triggerAlert]);

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

  const handleAddAlert = useCallback((alert: {
    symbolId: string;
    symbolName: string;
    targetPrice: number;
    condition: 'above' | 'below';
  }) => {
    addAlert(alert);
    toast.success(`Alert created for ${alert.symbolId} ${alert.condition === 'above' ? '≥' : '≤'} $${alert.targetPrice.toFixed(2)}`);
  }, [addAlert]);

  const handleExportPNG = useCallback(async () => {
    const success = await exportChartAsPNG('price-chart-container', `${currentSymbol.id}_${selectedPeriod}_chart`);
    if (success) {
      toast.success('Chart exported as PNG');
    } else {
      toast.error('Failed to export chart');
    }
  }, [currentSymbol.id, selectedPeriod]);

  const handleExportCSV = useCallback(() => {
    const success = exportDataAsCSV(chartData, currentSymbol.id, selectedPeriod);
    if (success) {
      toast.success('Data exported as CSV');
    } else {
      toast.error('Failed to export data');
    }
  }, [chartData, currentSymbol.id, selectedPeriod]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="h-screen flex flex-col bg-background">
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          onPortfolioClick={() => setPortfolioPanelOpen(true)}
          onMarketInsightsClick={() => setMarketInsightsOpen(true)}
          onDataImportClick={() => setDataImportOpen(true)}
          onRefresh={refreshMarket}
          isRefreshing={marketLoading}
          lastUpdated={lastUpdated}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <SymbolSidebar
            className="hidden lg:flex"
            symbols={marketSymbols}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSymbolSelect}
            onAISearch={handleAISearch}
            isAILoading={aiLoading}
          />

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72">
              <SymbolSidebar
                symbols={marketSymbols}
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
              alertsCount={alerts.length}
              onOpenAlerts={() => setAlertsPanelOpen(true)}
              alertButton={
                <PriceAlertDialog
                  symbolId={currentSymbol.id}
                  symbolName={currentSymbol.name}
                  currentPrice={currentSymbol.price}
                  onAddAlert={handleAddAlert}
                />
              }
            />
            
            <div className="flex-1 overflow-auto p-4">
              {/* Commodity Cards */}
              {commodities.length > 0 && (
                <CommodityCards
                  commodities={commodities}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={handleSymbolSelect}
                  className="mb-4"
                />
              )}
              
              <FullscreenChart title={`${currentSymbol.id} - ${currentSymbol.name}`}>
                <div id="price-chart-container">
                  <PriceChart
                    data={chartData}
                    chartType={chartType}
                    indicators={indicators}
                  />
                </div>
              </FullscreenChart>
              
              {/* Stats and AI Analysis side by side */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatsPanel stats={stats} />
                <AIMarketAnalysis
                  symbolId={currentSymbol.id}
                  symbolName={currentSymbol.name}
                  currentPrice={currentSymbol.price}
                />
              </div>
              {/* Correlation Matrix */}
              <CorrelationMatrix symbols={marketSymbols} className="mt-4" />
            </div>
          </main>

          {/* Historical Data Sidebar */}
          <HistoricalSidebar
            data={chartData}
            symbolId={currentSymbol.id}
            symbolName={currentSymbol.name}
            isOpen={historicalSidebarOpen}
            onToggle={() => setHistoricalSidebarOpen(!historicalSidebarOpen)}
          />
          <AIResultsPanel
            isOpen={aiPanelOpen}
            onClose={() => setAIPanelOpen(false)}
            query={aiQuery}
            answer={aiResult?.answer}
            citations={aiResult?.citations}
            isLoading={aiLoading}
          />

          {/* Alerts Panel */}
          <AlertsPanel
            isOpen={alertsPanelOpen}
            onClose={() => setAlertsPanelOpen(false)}
            alerts={alerts}
            triggeredAlerts={triggeredAlerts}
            onRemoveAlert={removeAlert}
            onClearTriggered={clearTriggered}
          />

          {/* Portfolio Panel */}
          <PortfolioPanel
            isOpen={portfolioPanelOpen}
            onClose={() => setPortfolioPanelOpen(false)}
            symbols={marketSymbols}
          />

          {/* Market Insights Panel */}
          <MarketInsightsPanel
            isOpen={marketInsightsOpen}
            onClose={() => setMarketInsightsOpen(false)}
            symbols={marketSymbols}
            onSelectSymbol={handleSymbolSelect}
          />

          {/* Data Import Panel */}
          <DataImportPanel
            isOpen={dataImportOpen}
            onClose={() => setDataImportOpen(false)}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Dashboard;
