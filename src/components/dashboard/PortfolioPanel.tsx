import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Briefcase, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { usePortfolio, type Portfolio, type Position } from '@/hooks/usePortfolio';
import type { MarketSymbol } from '@/hooks/useMarketData';

interface PortfolioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: MarketSymbol[];
}

export const PortfolioPanel = ({
  isOpen,
  onClose,
  symbols,
}: PortfolioPanelProps) => {
  const {
    portfolios,
    activePortfolio,
    activePortfolioId,
    setActivePortfolioId,
    createPortfolio,
    deletePortfolio,
    addPosition,
    removePosition,
    calculatePortfolioValue,
    getPositionPnL,
  } = usePortfolio();

  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');

  // Build current prices map
  const currentPrices: Record<string, number> = {};
  symbols.forEach(s => {
    currentPrices[s.id] = s.price;
  });

  const portfolioStats = activePortfolio 
    ? calculatePortfolioValue(activePortfolio, currentPrices)
    : null;

  const handleCreatePortfolio = () => {
    if (newPortfolioName.trim()) {
      createPortfolio(newPortfolioName.trim());
      setNewPortfolioName('');
    }
  };

  const handleAddPosition = () => {
    if (!activePortfolioId || !selectedSymbol || !quantity || !avgCost) return;
    
    const symbol = symbols.find(s => s.id === selectedSymbol);
    if (!symbol) return;

    addPosition(
      activePortfolioId,
      selectedSymbol,
      symbol.name,
      parseFloat(quantity),
      parseFloat(avgCost)
    );

    setShowAddPosition(false);
    setSelectedSymbol('');
    setQuantity('');
    setAvgCost('');
  };

  const handleSymbolSelect = (symbolId: string) => {
    setSelectedSymbol(symbolId);
    const symbol = symbols.find(s => s.id === symbolId);
    if (symbol) {
      setAvgCost(symbol.price.toFixed(2));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Portfolio Tracker
          </SheetTitle>
          <SheetDescription>
            Track your positions and monitor P&L
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Portfolio Selector */}
          <div className="flex gap-2">
            <Select value={activePortfolioId || ''} onValueChange={setActivePortfolioId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Portfolio</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolioName">Portfolio Name</Label>
                    <Input
                      id="portfolioName"
                      value={newPortfolioName}
                      onChange={(e) => setNewPortfolioName(e.target.value)}
                      placeholder="My Portfolio"
                    />
                  </div>
                  <Button onClick={handleCreatePortfolio} className="w-full">
                    Create Portfolio
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {activePortfolio && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => deletePortfolio(activePortfolio.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {activePortfolio && portfolioStats && (
            <>
              {/* Portfolio Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold">
                    ${portfolioStats.totalValue.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border",
                  portfolioStats.totalPnL >= 0 
                    ? "bg-chart-up/10 border-chart-up/20"
                    : "bg-chart-down/10 border-chart-down/20"
                )}>
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                  <div className="flex items-center gap-1">
                    {portfolioStats.totalPnL >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-chart-up" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-chart-down" />
                    )}
                    <span className={cn(
                      "text-lg font-bold",
                      portfolioStats.totalPnL >= 0 ? "text-chart-up" : "text-chart-down"
                    )}>
                      {portfolioStats.totalPnL >= 0 ? '+' : ''}
                      ${portfolioStats.totalPnL.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs",
                    portfolioStats.totalPnL >= 0 ? "text-chart-up" : "text-chart-down"
                  )}>
                    {portfolioStats.totalPnLPercent >= 0 ? '+' : ''}
                    {portfolioStats.totalPnLPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Add Position Button */}
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setShowAddPosition(true)}
              >
                <Plus className="h-4 w-4" />
                Add Position
              </Button>

              {/* Add Position Form */}
              {showAddPosition && (
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add Position</h4>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setShowAddPosition(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Symbol</Label>
                      <Select value={selectedSymbol} onValueChange={handleSymbolSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select symbol" />
                        </SelectTrigger>
                        <SelectContent>
                          {symbols.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.id} - {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Avg Cost ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={avgCost}
                          onChange={(e) => setAvgCost(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleAddPosition} className="w-full">
                      Add Position
                    </Button>
                  </div>
                </div>
              )}

              {/* Positions List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Positions ({activePortfolio.positions.length})
                </h3>
                <ScrollArea className="h-[300px]">
                  {activePortfolio.positions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No positions yet</p>
                      <p className="text-xs mt-1">Add your first position above</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {activePortfolio.positions.map((position) => {
                        const currentPrice = currentPrices[position.symbolId] || position.avgCost;
                        const pnlData = getPositionPnL(position, currentPrice);
                        const isPositive = pnlData.pnl >= 0;

                        return (
                          <div
                            key={position.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{position.symbolId}</span>
                                <span className="text-xs text-muted-foreground">
                                  {position.quantity} @ ${position.avgCost.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm">
                                  ${pnlData.currentValue.toLocaleString(undefined, { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  })}
                                </span>
                                <span className={cn(
                                  "text-xs font-medium",
                                  isPositive ? "text-chart-up" : "text-chart-down"
                                )}>
                                  {isPositive ? '+' : ''}{pnlData.pnlPercent.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "text-right px-2 py-1 rounded",
                                isPositive 
                                  ? "bg-chart-up/10 text-chart-up" 
                                  : "bg-chart-down/10 text-chart-down"
                              )}>
                                <p className="text-sm font-medium">
                                  {isPositive ? '+' : ''}${pnlData.pnl.toFixed(2)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removePosition(activePortfolio.id, position.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}

          {!activePortfolio && (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No portfolio selected</p>
              <p className="text-xs mt-1">Create a portfolio to start tracking</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
