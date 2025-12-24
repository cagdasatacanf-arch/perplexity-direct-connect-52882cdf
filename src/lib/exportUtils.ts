import html2canvas from 'html2canvas';

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Export a DOM element as PNG image
 */
export const exportChartAsPNG = async (
  elementId: string,
  filename: string
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Chart element not found');
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#1a1a2e', // Match dark theme background
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch (error) {
    console.error('Failed to export chart as PNG:', error);
    return false;
  }
};

/**
 * Export chart data as CSV file
 */
export const exportDataAsCSV = (
  data: ChartDataPoint[],
  symbolId: string,
  period: string
): boolean => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return false;
  }

  try {
    // CSV headers
    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
    
    // Convert data to CSV rows
    const rows = data.map(point => [
      point.date,
      point.open.toFixed(2),
      point.high.toFixed(2),
      point.low.toFixed(2),
      point.close.toFixed(2),
      point.volume.toString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${symbolId}_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export data as CSV:', error);
    return false;
  }
};
