import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Download, Filter, FileJson, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { mockMarketData, mockProcessingResults, mockSearchResults } from '@/lib/mockData';

type ResultType = 'market' | 'dataset' | 'search';

export const ResultsViewerPanel = () => {
  const [resultType, setResultType] = useState<ResultType>('market');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredMarketData = mockMarketData.filter(item =>
    item.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Results Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={resultType} onValueChange={(v) => setResultType(v as ResultType)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Select result type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Market Data
                  </div>
                </SelectItem>
                <SelectItem value="dataset">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Dataset Results
                  </div>
                </SelectItem>
                <SelectItem value="search">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Search Results
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter results..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={resultType} onValueChange={(v) => setResultType(v as ResultType)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="market">Market Data</TabsTrigger>
              <TabsTrigger value="dataset">Dataset Results</TabsTrigger>
              <TabsTrigger value="search">Search Results</TabsTrigger>
            </TabsList>

            <TabsContent value="market">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change %</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarketData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${item.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">{item.volume}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="dataset">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                    <p className="text-xl font-bold">{mockProcessingResults.summary.totalRows.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Valid</p>
                    <p className="text-xl font-bold text-emerald-500">{mockProcessingResults.summary.validRows.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-xl font-bold text-red-500">{mockProcessingResults.summary.errorRows}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="text-xl font-bold">{mockProcessingResults.summary.processingTime}</p>
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {mockProcessingResults.columns.map(col => (
                          <TableHead key={col} className="capitalize">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProcessingResults.preview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="font-mono">{row.symbol}</TableCell>
                          <TableCell className="font-mono">{row.open}</TableCell>
                          <TableCell className="font-mono">{row.high}</TableCell>
                          <TableCell className="font-mono">{row.low}</TableCell>
                          <TableCell className="font-mono">{row.close}</TableCell>
                          <TableCell className="font-mono">{row.volume.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {mockSearchResults.map((result, index) => (
                    <div key={index} className="p-4 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.query}</h4>
                        <Badge variant="outline" className="text-xs">
                          {result.timestamp.toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.answer}</p>
                      <div className="flex gap-2">
                        {result.citations.map((url, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {new URL(url).hostname}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
