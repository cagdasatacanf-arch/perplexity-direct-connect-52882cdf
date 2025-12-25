import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Database, Sparkles, Eye, LineChart } from 'lucide-react';
import { DashboardPanel } from '@/components/panels/DashboardPanel';
import { MarketDataPanel } from '@/components/panels/MarketDataPanel';
import { ProcessDatasetPanel } from '@/components/panels/ProcessDatasetPanel';
import { PerplexitySearchPanel } from '@/components/panels/PerplexitySearchPanel';
import { ResultsViewerPanel } from '@/components/panels/ResultsViewerPanel';
import { PatternAnalysisPanel } from '@/components/panels/PatternAnalysisPanel';

const panels = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'market', label: 'Market Data', icon: TrendingUp },
  { id: 'patterns', label: 'Pattern Analysis', icon: LineChart },
  { id: 'dataset', label: 'Process Dataset', icon: Database },
  { id: 'search', label: 'Perplexity Search', icon: Sparkles },
  { id: 'results', label: 'Results Viewer', icon: Eye },
];

const PanelApp = () => {
  const [activePanel, setActivePanel] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Market Analysis Platform</h1>
          <p className="text-sm text-muted-foreground">Data ingestion, analysis, and AI-powered insights</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 h-auto gap-2 bg-muted/50 p-2">
            {panels.map((panel) => (
              <TabsTrigger
                key={panel.id}
                value={panel.id}
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
              >
                <panel.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{panel.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Panel Content */}
          <TabsContent value="dashboard" className="mt-6">
            <DashboardPanel />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <MarketDataPanel />
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <PatternAnalysisPanel />
          </TabsContent>

          <TabsContent value="dataset" className="mt-6">
            <ProcessDatasetPanel />
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <PerplexitySearchPanel />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsViewerPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PanelApp;
