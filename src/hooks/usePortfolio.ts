import { useState, useEffect, useCallback } from 'react';

export interface Position {
  id: string;
  symbolId: string;
  symbolName: string;
  quantity: number;
  avgCost: number;
  createdAt: number;
  updatedAt: number;
}

export interface Portfolio {
  id: string;
  name: string;
  positions: Position[];
  createdAt: number;
}

const PORTFOLIO_KEY = 'market-portfolios';

export const usePortfolio = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);

  // Load portfolios from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PORTFOLIO_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPortfolios(parsed);
        if (parsed.length > 0 && !activePortfolioId) {
          setActivePortfolioId(parsed[0].id);
        }
      } catch {
        setPortfolios([]);
      }
    }
  }, []);

  // Save portfolios to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolios));
  }, [portfolios]);

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || null;

  const createPortfolio = useCallback((name: string) => {
    const newPortfolio: Portfolio = {
      id: crypto.randomUUID(),
      name,
      positions: [],
      createdAt: Date.now(),
    };
    setPortfolios(prev => [...prev, newPortfolio]);
    setActivePortfolioId(newPortfolio.id);
    return newPortfolio;
  }, []);

  const deletePortfolio = useCallback((id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    if (activePortfolioId === id) {
      setActivePortfolioId(portfolios.length > 1 ? portfolios[0]?.id : null);
    }
  }, [activePortfolioId, portfolios]);

  const renamePortfolio = useCallback((id: string, name: string) => {
    setPortfolios(prev => 
      prev.map(p => p.id === id ? { ...p, name } : p)
    );
  }, []);

  const addPosition = useCallback((
    portfolioId: string,
    symbolId: string,
    symbolName: string,
    quantity: number,
    avgCost: number
  ) => {
    const newPosition: Position = {
      id: crypto.randomUUID(),
      symbolId,
      symbolName,
      quantity,
      avgCost,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setPortfolios(prev => 
      prev.map(p => {
        if (p.id !== portfolioId) return p;
        
        // Check if position already exists for this symbol
        const existingIndex = p.positions.findIndex(pos => pos.symbolId === symbolId);
        if (existingIndex >= 0) {
          // Update existing position with weighted average cost
          const existing = p.positions[existingIndex];
          const totalQuantity = existing.quantity + quantity;
          const weightedAvgCost = (existing.quantity * existing.avgCost + quantity * avgCost) / totalQuantity;
          
          const updatedPositions = [...p.positions];
          updatedPositions[existingIndex] = {
            ...existing,
            quantity: totalQuantity,
            avgCost: weightedAvgCost,
            updatedAt: Date.now(),
          };
          
          return { ...p, positions: updatedPositions };
        }
        
        // Add new position
        return { ...p, positions: [...p.positions, newPosition] };
      })
    );
    
    return newPosition;
  }, []);

  const updatePosition = useCallback((
    portfolioId: string,
    positionId: string,
    updates: Partial<Pick<Position, 'quantity' | 'avgCost'>>
  ) => {
    setPortfolios(prev => 
      prev.map(p => {
        if (p.id !== portfolioId) return p;
        return {
          ...p,
          positions: p.positions.map(pos => 
            pos.id === positionId 
              ? { ...pos, ...updates, updatedAt: Date.now() }
              : pos
          ),
        };
      })
    );
  }, []);

  const removePosition = useCallback((portfolioId: string, positionId: string) => {
    setPortfolios(prev => 
      prev.map(p => {
        if (p.id !== portfolioId) return p;
        return {
          ...p,
          positions: p.positions.filter(pos => pos.id !== positionId),
        };
      })
    );
  }, []);

  const calculatePortfolioValue = useCallback((
    portfolio: Portfolio,
    currentPrices: Record<string, number>
  ) => {
    let totalValue = 0;
    let totalCost = 0;

    portfolio.positions.forEach(pos => {
      const currentPrice = currentPrices[pos.symbolId] || pos.avgCost;
      totalValue += pos.quantity * currentPrice;
      totalCost += pos.quantity * pos.avgCost;
    });

    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
    };
  }, []);

  const getPositionPnL = useCallback((position: Position, currentPrice: number) => {
    const currentValue = position.quantity * currentPrice;
    const costBasis = position.quantity * position.avgCost;
    const pnl = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return {
      currentValue,
      costBasis,
      pnl,
      pnlPercent,
    };
  }, []);

  return {
    portfolios,
    activePortfolio,
    activePortfolioId,
    setActivePortfolioId,
    createPortfolio,
    deletePortfolio,
    renamePortfolio,
    addPosition,
    updatePosition,
    removePosition,
    calculatePortfolioValue,
    getPositionPnL,
  };
};
