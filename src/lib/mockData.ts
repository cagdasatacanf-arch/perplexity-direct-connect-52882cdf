// Mock data for all panels

export const mockMarketData = [
  { id: 'AAPL', name: 'Apple Inc.', price: 178.52, change: 2.34, changePercent: 1.33, volume: '52.3M' },
  { id: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -1.25, changePercent: -0.87, volume: '28.1M' },
  { id: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 4.56, changePercent: 1.22, volume: '31.2M' },
  { id: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 3.12, changePercent: 1.78, volume: '45.8M' },
  { id: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -5.75, changePercent: -2.26, volume: '89.4M' },
  { id: 'GOLD', name: 'Gold Futures', price: 2024.30, change: 12.50, changePercent: 0.62, volume: '182K' },
  { id: 'SILVER', name: 'Silver Futures', price: 23.45, change: 0.28, changePercent: 1.21, volume: '95K' },
  { id: 'OIL', name: 'Crude Oil WTI', price: 71.82, change: -0.95, changePercent: -1.31, volume: '312K' },
];

export const mockDatasets = [
  { id: '1', name: 'Q4 Sales Report', status: 'processed', rows: 15420, columns: 12, createdAt: '2024-01-15' },
  { id: '2', name: 'Customer Analytics', status: 'processing', rows: 8750, columns: 8, createdAt: '2024-01-14' },
  { id: '3', name: 'Market Trends 2024', status: 'pending', rows: 0, columns: 0, createdAt: '2024-01-13' },
  { id: '4', name: 'Inventory Data', status: 'processed', rows: 32100, columns: 15, createdAt: '2024-01-12' },
];

export const mockSearchResults = [
  {
    query: 'What are the latest AI trends in 2024?',
    answer: 'The latest AI trends in 2024 include multimodal AI systems, smaller and more efficient language models, AI agents for autonomous tasks, and increased focus on AI safety and alignment research.',
    citations: ['https://example.com/ai-trends', 'https://research.ai/2024-report'],
    timestamp: new Date('2024-01-15T10:30:00'),
  },
  {
    query: 'How does gold price affect stock market?',
    answer: 'Gold prices often have an inverse relationship with stock markets. When investors lose confidence in equities, they typically move to gold as a safe haven, driving its price up.',
    citations: ['https://finance.example.com/gold-stocks', 'https://economics.edu/correlation'],
    timestamp: new Date('2024-01-14T15:45:00'),
  },
];

export const mockDashboardStats = {
  totalSymbols: 156,
  activeAlerts: 12,
  datasetsProcessed: 47,
  searchQueries: 234,
  portfolioValue: 125680.50,
  dailyChange: 2.45,
};

export const mockProcessingResults = {
  summary: {
    totalRows: 15420,
    validRows: 15380,
    errorRows: 40,
    processingTime: '2.3s',
  },
  columns: ['date', 'symbol', 'open', 'high', 'low', 'close', 'volume'],
  preview: [
    { date: '2024-01-15', symbol: 'AAPL', open: 176.50, high: 179.20, low: 175.80, close: 178.52, volume: 52300000 },
    { date: '2024-01-15', symbol: 'GOOGL', open: 142.80, high: 143.50, low: 140.20, close: 141.80, volume: 28100000 },
    { date: '2024-01-15', symbol: 'MSFT', open: 375.00, high: 380.50, low: 374.20, close: 378.91, volume: 31200000 },
  ],
};
