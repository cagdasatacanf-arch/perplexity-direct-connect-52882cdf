import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Upload, FileSpreadsheet, CheckCircle2, Clock, AlertCircle, Play } from 'lucide-react';
import { mockDatasets, mockProcessingResults } from '@/lib/mockData';

export const ProcessDatasetPanel = () => {
  const [datasetName, setDatasetName] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleProcess = () => {
    if (!selectedDataset) return;
    setIsProcessing(true);
    setProgress(0);
    setShowResults(false);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setShowResults(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" />Processed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-500"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Process Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataset-name">Dataset Name</Label>
              <Input
                id="dataset-name"
                placeholder="Enter dataset name..."
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Existing Dataset</Label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {mockDatasets.map(ds => (
                    <SelectItem key={ds.id} value={ds.id}>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        {ds.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload New
            </Button>
            <Button onClick={handleProcess} disabled={!selectedDataset || isProcessing} className="gap-2">
              <Play className="h-4 w-4" />
              Run Processing
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datasets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Datasets</span>
            <Badge variant="secondary">{mockDatasets.length} datasets</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Columns</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDatasets.map((ds) => (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium">{ds.name}</TableCell>
                    <TableCell>{getStatusBadge(ds.status)}</TableCell>
                    <TableCell className="text-right">{ds.rows.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{ds.columns}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{ds.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Processing Results */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{mockProcessingResults.summary.totalRows.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Valid Rows</p>
                <p className="text-2xl font-bold text-emerald-500">{mockProcessingResults.summary.validRows.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Error Rows</p>
                <p className="text-2xl font-bold text-red-500">{mockProcessingResults.summary.errorRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Processing Time</p>
                <p className="text-2xl font-bold">{mockProcessingResults.summary.processingTime}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Data Preview</h4>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {mockProcessingResults.columns.map(col => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProcessingResults.preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.symbol}</TableCell>
                        <TableCell>{row.open}</TableCell>
                        <TableCell>{row.high}</TableCell>
                        <TableCell>{row.low}</TableCell>
                        <TableCell>{row.close}</TableCell>
                        <TableCell>{row.volume.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
