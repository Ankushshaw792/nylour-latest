import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface CardPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: (cardDetails: { number: string; expiry: string; cvv: string; name: string }) => void;
  isProcessing: boolean;
}

export const CardPaymentSheet = ({
  open,
  onOpenChange,
  amount,
  onConfirm,
  isProcessing,
}: CardPaymentSheetProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleConfirm = () => {
    onConfirm({
      number: cardNumber || "4111 1111 1111 1111",
      expiry: expiry || "12/28",
      cvv: cvv || "123",
      name: name || "CARDHOLDER",
    });
  };

  const getCardType = () => {
    const firstDigit = cardNumber.replace(/\D/g, "")[0];
    if (firstDigit === "4") return "visa";
    if (firstDigit === "5") return "mastercard";
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            Credit / Debit Card
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Amount Display */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Amount to pay</p>
            <p className="text-3xl font-bold text-primary">₹{amount}</p>
          </div>

          {/* Card Preview */}
          <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl">
            <div className="absolute top-4 right-4 flex gap-2">
              {getCardType() === "visa" && (
                <span className="text-xl font-bold italic">VISA</span>
              )}
              {getCardType() === "mastercard" && (
                <div className="flex">
                  <div className="w-6 h-6 bg-red-500 rounded-full opacity-80" />
                  <div className="w-6 h-6 bg-yellow-500 rounded-full -ml-2 opacity-80" />
                </div>
              )}
            </div>
            <div className="absolute bottom-16 left-5">
              <p className="text-lg tracking-widest font-mono">
                {cardNumber || "•••• •••• •••• ••••"}
              </p>
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
              <div>
                <p className="text-xs text-white/60">CARDHOLDER</p>
                <p className="text-sm font-medium">{name.toUpperCase() || "YOUR NAME"}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">EXPIRES</p>
                <p className="text-sm font-medium">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>

          {/* Card Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="h-12 text-lg font-mono"
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="Name on card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="h-12 text-center font-mono"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="•••"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="h-12 text-center font-mono"
                  maxLength={3}
                />
              </div>
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
            Secured by 256-bit encryption • Your card details are safe
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
