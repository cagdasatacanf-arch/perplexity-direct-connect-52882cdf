import { Calendar, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EconomicCalendar } from './EconomicCalendar';
import { SectorRotation } from './SectorRotation';

interface MarketSymbol {
  id: string;
  name: string;
  price: number;
  change: number;
  category: 'metal' | 'stock';
}

interface MarketInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: MarketSymbol[];
  onSelectSymbol: (id: string) => void;
}

export const MarketInsightsPanel = ({
  isOpen,
  onClose,
  symbols,
  onSelectSymbol,
}: MarketInsightsPanelProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Market Insights
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-4">
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="sectors" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sectors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-0">
                <EconomicCalendar />
              </TabsContent>

              <TabsContent value="sectors" className="mt-0">
                <SectorRotation 
                  symbols={symbols} 
                  onSelectSymbol={(id) => {
                    onSelectSymbol(id);
                    onClose();
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
