import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

interface PaymentProcessingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  paymentMethod: string;
  amount: number;
}

export const PaymentProcessingOverlay = ({
  isVisible,
  onComplete,
  paymentMethod,
  amount,
}: PaymentProcessingOverlayProps) => {
  const [stage, setStage] = useState<"processing" | "verifying" | "success">("processing");
  const [transactionId, setTransactionId] = useState("");
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isVisible) {
      hasStartedRef.current = false;
      setStage("processing");
      return;
    }

    // Prevent re-running timers if already started
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Generate transaction ID
    setTransactionId(`TXN${Date.now().toString().slice(-10)}`);

    // Simulate payment processing stages
    const timer1 = setTimeout(() => setStage("verifying"), 1200);
    const timer2 = setTimeout(() => setStage("success"), 2400);
    const timer3 = setTimeout(() => onCompleteRef.current(), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
        {/* Animation Container */}
        <div className="relative w-32 h-32">
          {stage === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Loader2 className="absolute h-10 w-10 text-primary animate-pulse" />
            </div>
          )}
          
          {stage === "verifying" && (
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-12 w-12 text-amber-600" />
              </div>
            </div>
          )}
          
          {stage === "success" && (
            <div className="absolute inset-0 flex items-center justify-center animate-bounce-once">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-14 w-14 text-green-600" />
              </div>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          {stage === "processing" && (
            <>
              <h2 className="text-xl font-semibold">Processing Payment</h2>
              <p className="text-muted-foreground">Connecting to {paymentMethod}...</p>
            </>
          )}
          
          {stage === "verifying" && (
            <>
              <h2 className="text-xl font-semibold">Verifying Payment</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment</p>
            </>
          )}
          
          {stage === "success" && (
            <>
              <h2 className="text-xl font-semibold text-green-600">Payment Successful!</h2>
              <p className="text-muted-foreground">Your booking has been confirmed</p>
            </>
          )}
        </div>

        {/* Transaction Details */}
        <div className="w-full p-4 bg-muted/50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-semibold">₹{amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">{paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-xs">{transactionId}</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>Secured by 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};
