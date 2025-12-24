import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2, Database, RefreshCw, Cloud, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  row_count: number | null;
  date_column: string | null;
  value_columns: string[] | null;
  error_message: string | null;
  created_at: string;
}

interface DataImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetProcessed?: (datasetId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
  return `${bytes} B`;
};

export const DataImportPanel = ({ isOpen, onClose, onDatasetProcessed }: DataImportPanelProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [datasetName, setDatasetName] = useState('');
  const [importingFileId, setImportingFileId] = useState<string | null>(null);

  const {
    isConnected: isDriveConnected,
    isConnecting: isDriveConnecting,
    files: driveFiles,
    isLoadingFiles: isLoadingDriveFiles,
    hasMoreFiles,
    connect: connectDrive,
    disconnect: disconnectDrive,
    handleCallback: handleDriveCallback,
    listFiles: listDriveFiles,
    importFile: importDriveFile,
  } = useGoogleDrive();

  // Handle OAuth callback from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const oauthState = sessionStorage.getItem('oauth_state');

    if (code && oauthState === 'google_drive') {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      handleDriveCallback(code);
    }
  }, [handleDriveCallback]);

  // Fetch datasets
  const fetchDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load datasets when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchDatasets();
      if (isDriveConnected) {
        listDriveFiles();
      }
    }
  }, [isOpen, isDriveConnected, fetchDatasets, listDriveFiles]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.name.endsWith('.csv') ? 'csv' : 
                     file.name.endsWith('.json') ? 'json' : null;

    if (!fileType) {
      toast.error('Please upload a CSV or JSON file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit for direct upload
      toast.error('File too large. Maximum size is 100MB for direct upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload to storage
      setUploadProgress(30);
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Create dataset record
      const { data: dataset, error: insertError } = await supabase
        .from('datasets')
        .insert({
          name: datasetName || file.name.replace(/\.(csv|json)$/i, ''),
          file_name: fileName,
          file_size: file.size,
          file_type: fileType,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setUploadProgress(80);

      // Trigger processing
      const { error: processError } = await supabase.functions.invoke('process-dataset', {
        body: { datasetId: dataset.id },
      });

      if (processError) {
        console.error('Process error:', processError);
        // Don't throw - the dataset was created, just failed to process
        toast.warning('Dataset uploaded but processing failed. You can retry later.');
      } else {
        toast.success('Dataset uploaded and processing started!');
        onDatasetProcessed?.(dataset.id);
      }

      setUploadProgress(100);
      setDatasetName('');
      fetchDatasets();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload dataset');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  // Retry processing
  const handleRetryProcessing = async (datasetId: string) => {
    try {
      await supabase
        .from('datasets')
        .update({ status: 'pending', error_message: null })
        .eq('id', datasetId);

      const { error } = await supabase.functions.invoke('process-dataset', {
        body: { datasetId },
      });

      if (error) throw error;
      toast.success('Processing restarted');
      fetchDatasets();
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to restart processing');
    }
  };

  // Delete dataset
  const handleDelete = async (dataset: Dataset) => {
    try {
      // Delete from storage
      await supabase.storage.from('datasets').remove([dataset.file_name]);
      
      // Delete record (summaries cascade delete)
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', dataset.id);

      if (error) throw error;
      toast.success('Dataset deleted');
      fetchDatasets();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete dataset');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-chart-up/20 text-chart-up border-chart-up/30"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Handle Drive file import
  const handleDriveImport = async (file: { id: string; name: string; mimeType: string }) => {
    setImportingFileId(file.id);
    try {
      const datasetId = await importDriveFile(file, datasetName || undefined);
      if (datasetId) {
        onDatasetProcessed?.(datasetId);
        setDatasetName('');
        fetchDatasets();
      }
    } finally {
      setImportingFileId(null);
    }
  };

  const formatDriveFileSize = (size?: string) => {
    if (!size) return 'Unknown size';
    const bytes = parseInt(size);
    return formatFileSize(bytes);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Import Pipeline
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-4 space-y-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="drive">
                  <Cloud className="h-4 w-4 mr-2" />
                  Google Drive
                </TabsTrigger>
              </TabsList>

              {/* Local Upload Tab */}
              <TabsContent value="upload" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Dataset
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="dataset-name" className="text-xs">Dataset Name (optional)</Label>
                      <Input
                        id="dataset-name"
                        placeholder="My Financial Data"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">File (CSV or JSON)</Label>
                      <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept=".csv,.json"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          {isUploading ? (
                            <div className="space-y-2">
                              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                              <Progress value={uploadProgress} className="h-2" />
                            </div>
                          ) : (
                            <>
                              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload CSV or JSON
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Max 100MB • Auto-detects date & price columns
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Google Drive Tab */}
              <TabsContent value="drive" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Google Drive
                      </span>
                      {isDriveConnected && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={disconnectDrive}
                          className="text-xs h-7"
                        >
                          <LogOut className="h-3 w-3 mr-1" />
                          Disconnect
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!isDriveConnected ? (
                      <div className="text-center py-4">
                        <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect to Google Drive to import large datasets directly
                        </p>
                        <Button 
                          onClick={connectDrive} 
                          disabled={isDriveConnecting}
                          className="w-full"
                        >
                          {isDriveConnecting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Cloud className="h-4 w-4 mr-2" />
                              Connect Google Drive
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Select a CSV, JSON, or Google Sheet to import
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => listDriveFiles()} 
                            disabled={isLoadingDriveFiles}
                          >
                            <RefreshCw className={`h-4 w-4 ${isLoadingDriveFiles ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>

                        {isLoadingDriveFiles && driveFiles.length === 0 ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : driveFiles.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No compatible files found in Drive
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {driveFiles.map((file) => (
                              <div
                                key={file.id}
                                className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.mimeType === 'application/vnd.google-apps.spreadsheet' 
                                      ? 'Google Sheet' 
                                      : file.mimeType.split('/')[1]?.toUpperCase() || 'File'
                                    }
                                    {file.size && ` • ${formatDriveFileSize(file.size)}`}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleDriveImport(file)}
                                  disabled={importingFileId === file.id}
                                  className="shrink-0"
                                >
                                  {importingFileId === file.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Import'
                                  )}
                                </Button>
                              </div>
                            ))}
                            
                            {hasMoreFiles && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => listDriveFiles(true)}
                                disabled={isLoadingDriveFiles}
                                className="w-full"
                              >
                                {isLoadingDriveFiles ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Load More
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Datasets List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Your Datasets</CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchDatasets} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {datasets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No datasets yet. Upload your first file above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="p-3 rounded-lg border bg-muted/30 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{dataset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(dataset.file_size)} • {dataset.file_type.toUpperCase()}
                            </p>
                          </div>
                          {getStatusBadge(dataset.status)}
                        </div>

                        {dataset.status === 'completed' && (
                          <div className="text-xs text-muted-foreground">
                            <p>{dataset.row_count?.toLocaleString()} rows → aggregated summaries</p>
                            {dataset.date_column && (
                              <p>Date: {dataset.date_column}</p>
                            )}
                          </div>
                        )}

                        {dataset.status === 'failed' && dataset.error_message && (
                          <p className="text-xs text-destructive">{dataset.error_message}</p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          {dataset.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryProcessing(dataset.id)}
                              className="text-xs h-7"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(dataset)}
                            className="text-xs h-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm mb-2">Supported Data Sources</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Local files: CSV, JSON (up to 100MB)</li>
                  <li>• Google Drive: CSV, JSON, Google Sheets</li>
                  <li>• Auto-detects: date, open, high, low, close, volume</li>
                  <li>• Aggregates data by day for efficient charting</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
