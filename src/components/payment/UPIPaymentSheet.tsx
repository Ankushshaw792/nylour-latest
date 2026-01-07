import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UPIPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: (upiId: string) => void;
  isProcessing: boolean;
}

const upiApps = [
  { name: "Google Pay", icon: "G", color: "bg-blue-500" },
  { name: "PhonePe", icon: "P", color: "bg-purple-600" },
  { name: "Paytm", icon: "₹", color: "bg-sky-500" },
  { name: "BHIM", icon: "B", color: "bg-green-600" },
];

export const UPIPaymentSheet = ({
  open,
  onOpenChange,
  amount,
  onConfirm,
  isProcessing,
}: UPIPaymentSheetProps) => {
  const [upiId, setUpiId] = useState("");

  const handleConfirm = () => {
    const finalUpiId = upiId.trim() || "user@upi";
    onConfirm(finalUpiId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600">UPI</span>
            </div>
            Pay via UPI
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Amount Display */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Amount to pay</p>
            <p className="text-3xl font-bold text-primary">₹{amount}</p>
          </div>

          {/* UPI ID Input */}
          <div className="space-y-2">
            <Label htmlFor="upi-id">Enter UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="h-12 text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Enter your UPI ID or select an app below
            </p>
          </div>

          {/* UPI Apps */}
          <div className="space-y-2">
            <Label>Or pay using</Label>
            <div className="grid grid-cols-4 gap-3">
              {upiApps.map((app) => (
                <button
                  key={app.name}
                  onClick={() => setUpiId(`user@${app.name.toLowerCase().replace(" ", "")}`)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 ${app.color} rounded-full flex items-center justify-center text-white font-bold`}>
                    {app.icon}
                  </div>
                  <span className="text-xs text-muted-foreground">{app.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full h-14 text-lg font-semibold"
            variant="gradient"
          >
            {isProcessing ? "Processing..." : `Pay ₹${amount}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secured by UPI • Your payment is safe and encrypted
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
