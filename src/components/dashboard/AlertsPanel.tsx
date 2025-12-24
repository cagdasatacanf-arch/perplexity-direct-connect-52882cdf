import { Bell, X, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { PriceAlert } from '@/hooks/useAlerts';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  triggeredAlerts: PriceAlert[];
  onRemoveAlert: (id: string) => void;
  onClearTriggered: () => void;
}

export const AlertsPanel = ({
  isOpen,
  onClose,
  alerts,
  triggeredAlerts,
  onRemoveAlert,
  onClearTriggered,
}: AlertsPanelProps) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Price Alerts
          </SheetTitle>
          <SheetDescription>
            Manage your price alerts and view triggered notifications.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Triggered Alerts */}
          {triggeredAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Triggered ({triggeredAlerts.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearTriggered}
                  className="h-7 text-xs gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      {alert.condition === 'above' ? (
                        <TrendingUp className="h-4 w-4 text-chart-up" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-chart-down" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{alert.symbolId}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.condition === 'above' ? '≥' : '≤'} ${alert.targetPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRemoveAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Alerts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Active Alerts ({alerts.length})
            </h3>
            <ScrollArea className="h-[400px]">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No active alerts</p>
                  <p className="text-xs mt-1">
                    Set alerts from the chart toolbar
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-md",
                          alert.condition === 'above' 
                            ? "bg-chart-up/10 text-chart-up" 
                            : "bg-chart-down/10 text-chart-down"
                        )}>
                          {alert.condition === 'above' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {alert.symbolId} {alert.condition === 'above' ? '≥' : '≤'} ${alert.targetPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
