import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Database, Search, Wallet, Bell } from 'lucide-react';
import { mockDashboardStats, mockMarketData } from '@/lib/mockData';

export const DashboardPanel = () => {
  const [filter, setFilter] = useState('');
  
  const filteredSymbols = mockMarketData.filter(s => 
    s.id.toLowerCase().includes(filter.toLowerCase()) ||
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = [
    { label: 'Total Symbols', value: mockDashboardStats.totalSymbols, icon: BarChart3, color: 'text-blue-500' },
    { label: 'Active Alerts', value: mockDashboardStats.activeAlerts, icon: Bell, color: 'text-amber-500' },
    { label: 'Datasets', value: mockDashboardStats.datasetsProcessed, icon: Database, color: 'text-emerald-500' },
    { label: 'Searches', value: mockDashboardStats.searchQueries, icon: Search, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Filter symbols..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="secondary">Refresh Data</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold">
              ${mockDashboardStats.portfolioValue.toLocaleString()}
            </span>
            <Badge variant={mockDashboardStats.dailyChange >= 0 ? 'default' : 'destructive'}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {mockDashboardStats.dailyChange >= 0 ? '+' : ''}{mockDashboardStats.dailyChange}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Top Movers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Movers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredSymbols.slice(0, 5).map((symbol) => (
              <div key={symbol.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <span className="font-medium">{symbol.id}</span>
                  <span className="text-sm text-muted-foreground ml-2">{symbol.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${symbol.price.toFixed(2)}</div>
                  <div className={symbol.change >= 0 ? 'text-emerald-500 text-sm' : 'text-red-500 text-sm'}>
                    {symbol.change >= 0 ? '+' : ''}{symbol.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
