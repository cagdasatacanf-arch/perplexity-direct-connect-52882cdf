import { useState } from 'react';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface PriceAlertDialogProps {
  symbolId: string;
  symbolName: string;
  currentPrice: number;
  onAddAlert: (alert: {
    symbolId: string;
    symbolName: string;
    targetPrice: number;
    condition: 'above' | 'below';
  }) => void;
  trigger?: React.ReactNode;
}

export const PriceAlertDialog = ({
  symbolId,
  symbolName,
  currentPrice,
  onAddAlert,
  trigger,
}: PriceAlertDialogProps) => {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice.toFixed(2));
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    onAddAlert({
      symbolId,
      symbolName,
      targetPrice: price,
      condition,
    });
    setOpen(false);
    setTargetPrice(currentPrice.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Set Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Price Alert for {symbolId}
          </DialogTitle>
          <DialogDescription>
            Get notified when {symbolName} reaches your target price.
            Current price: ${currentPrice.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price ($)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label>Alert Condition</Label>
            <RadioGroup
              value={condition}
              onValueChange={(v) => setCondition(v as 'above' | 'below')}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="above"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  condition === 'above'
                    ? "border-chart-up bg-chart-up/10"
                    : "border-border hover:border-chart-up/50"
                )}
              >
                <RadioGroupItem value="above" id="above" className="sr-only" />
                <TrendingUp className={cn(
                  "h-5 w-5",
                  condition === 'above' ? "text-chart-up" : "text-muted-foreground"
                )} />
                <div>
                  <p className="font-medium">Price Above</p>
                  <p className="text-xs text-muted-foreground">Alert when ≥ target</p>
                </div>
              </Label>

              <Label
                htmlFor="below"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  condition === 'below'
                    ? "border-chart-down bg-chart-down/10"
                    : "border-border hover:border-chart-down/50"
                )}
              >
                <RadioGroupItem value="below" id="below" className="sr-only" />
                <TrendingDown className={cn(
                  "h-5 w-5",
                  condition === 'below' ? "text-chart-down" : "text-muted-foreground"
                )} />
                <div>
                  <p className="font-medium">Price Below</p>
                  <p className="text-xs text-muted-foreground">Alert when ≤ target</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Bell className="h-4 w-4" />
              Create Alert
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
