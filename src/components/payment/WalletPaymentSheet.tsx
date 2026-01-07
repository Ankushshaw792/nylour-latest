import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Wallet } from "lucide-react";

interface WalletPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: (walletName: string) => void;
  isProcessing: boolean;
}

const wallets = [
  { id: "paytm", name: "Paytm Wallet", icon: "₹", color: "bg-sky-500", balance: "₹2,450" },
  { id: "phonepe", name: "PhonePe Wallet", icon: "P", color: "bg-purple-600", balance: "₹1,200" },
  { id: "amazon", name: "Amazon Pay", icon: "A", color: "bg-orange-500", balance: "₹850" },
  { id: "freecharge", name: "Freecharge", icon: "F", color: "bg-green-500", balance: "₹320" },
];

export const WalletPaymentSheet = ({
  open,
  onOpenChange,
  amount,
  onConfirm,
  isProcessing,
}: WalletPaymentSheetProps) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleConfirm = () => {
    const wallet = selectedWallet || "paytm";
    onConfirm(wallet);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-600" />
            </div>
            Digital Wallet
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Amount Display */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Amount to pay</p>
            <p className="text-3xl font-bold text-primary">₹{amount}</p>
          </div>

          {/* Wallet Options */}
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => setSelectedWallet(wallet.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedWallet === wallet.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className={`w-12 h-12 ${wallet.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {wallet.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-sm text-muted-foreground">Balance: {wallet.balance}</p>
                </div>
                {selectedWallet === wallet.id && (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !selectedWallet}
            className="w-full h-14 text-lg font-semibold"
            variant="gradient"
          >
            {isProcessing ? "Processing..." : `Pay ₹${amount}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Instant payment • No additional charges
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
