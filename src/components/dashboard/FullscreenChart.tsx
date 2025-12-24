import { useState, useCallback, useEffect, ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FullscreenChartProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export const FullscreenChart = ({ children, title, className }: FullscreenChartProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <>
        {/* Placeholder to maintain layout */}
        <div className={cn("relative", className)}>
          <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg border border-dashed">
            <p className="text-muted-foreground text-sm">Chart in fullscreen mode</p>
          </div>
        </div>

        {/* Fullscreen overlay */}
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
            {title && <h2 className="font-semibold">{title}</h2>}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="gap-2"
              >
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chart content */}
          <div className="flex-1 p-4 overflow-auto">
            {children}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {children}
      <Button
        variant="secondary"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        title="Enter fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
