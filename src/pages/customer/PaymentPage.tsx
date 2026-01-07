import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UPIPaymentSheet } from "@/components/payment/UPIPaymentSheet";
import { CardPaymentSheet } from "@/components/payment/CardPaymentSheet";
import { WalletPaymentSheet } from "@/components/payment/WalletPaymentSheet";
import { PaymentProcessingOverlay } from "@/components/payment/PaymentProcessingOverlay";

const BOOKING_FEE = 10;

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const [booking, setBooking] = useState<any>(null);
  const [salon, setSalon] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  
  // Payment sheet states
  const [showUPISheet, setShowUPISheet] = useState(false);
  const [showCardSheet, setShowCardSheet] = useState(false);
  const [showWalletSheet, setShowWalletSheet] = useState(false);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ method: string; reference: string }>({ method: "", reference: "" });

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !user) return;

      // First get customer record by auth user id
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) return;

      // Then query bookings using the customer table id
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          salons (name, address)
        `)
        .eq('id', bookingId)
        .eq('customer_id', customer.id)
        .maybeSingle();

      if (bookingData) {
        setBooking(bookingData);
        setSalon(bookingData.salons);
      }
    };

    fetchBookingDetails();
  }, [bookingId, user]);

  const processPayment = useCallback(async () => {
    if (!booking || !user) return;
    
    try {
      // Generate transaction reference
      const transactionRef = `TXN${Date.now().toString().slice(-10)}`;
      
      // Update booking with payment details
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'completed',
          payment_method: paymentDetails.method,
          payment_reference: transactionRef,
          notes: `Payment: ${paymentDetails.method.toUpperCase()} - ₹${BOOKING_FEE} | Ref: ${transactionRef}`
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Queue entry is created automatically by database trigger
      // Navigate to confirmation page
      navigate(`/booking-confirmation/${booking.id}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setShowProcessingOverlay(false);
    }
  }, [booking, user, paymentDetails, navigate]);

  const handlePaymentMethodClick = () => {
    if (paymentMethod === "upi") {
      setShowUPISheet(true);
    } else if (paymentMethod === "card") {
      setShowCardSheet(true);
    } else if (paymentMethod === "wallet") {
      setShowWalletSheet(true);
    }
  };

  const handleUPIConfirm = (upiId: string) => {
    setPaymentDetails({ method: "UPI", reference: upiId });
    setShowUPISheet(false);
    setIsProcessing(true);
    setShowProcessingOverlay(true);
  };

  const handleCardConfirm = (cardDetails: { number: string; expiry: string; cvv: string; name: string }) => {
    const maskedCard = `****${cardDetails.number.replace(/\s/g, "").slice(-4)}`;
    setPaymentDetails({ method: "Card", reference: maskedCard });
    setShowCardSheet(false);
    setIsProcessing(true);
    setShowProcessingOverlay(true);
  };

  const handleWalletConfirm = (walletName: string) => {
    setPaymentDetails({ method: walletName.charAt(0).toUpperCase() + walletName.slice(1) + " Wallet", reference: walletName });
    setShowWalletSheet(false);
    setIsProcessing(true);
    setShowProcessingOverlay(true);
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <CustomerLayout
        headerProps={{
          title: "Payment",
          showBackButton: true,
          showProfile: false,
          showNotifications: false
        }}
        bottomButtonProps={{
          text: `Pay ₹${BOOKING_FEE} Now`,
          onClick: handlePaymentMethodClick,
          disabled: isProcessing
        }}
      >
        {/* Hero Section */}
        <div className="bg-gradient-hero text-white p-4">        
          <div className="text-center">
            <h2 className="text-xl font-bold">{salon?.name}</h2>
            <p className="text-white/90">Complete your payment</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Booking Fee</span>
                  <span className="font-medium">₹{BOOKING_FEE}</span>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{BOOKING_FEE}</span>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> This is a booking fee to secure your slot. Service charges will be paid at the salon.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-4">Select Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="upi" id="upi" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">UPI</span>
                      </div>
                      <div>
                        <Label htmlFor="upi" className="font-medium cursor-pointer">UPI</Label>
                        <p className="text-xs text-muted-foreground">Pay using any UPI app</p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="card" id="card" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <Label htmlFor="card" className="font-medium cursor-pointer">Credit / Debit Card</Label>
                        <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="wallet" id="wallet" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="wallet" className="font-medium cursor-pointer">Digital Wallet</Label>
                        <p className="text-xs text-muted-foreground">Paytm, PhonePe, Amazon Pay</p>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Spacer for bottom button */}
          <div className="h-20" />
        </div>
      </CustomerLayout>

      {/* Payment Sheets */}
      <UPIPaymentSheet
        open={showUPISheet}
        onOpenChange={setShowUPISheet}
        amount={BOOKING_FEE}
        onConfirm={handleUPIConfirm}
        isProcessing={isProcessing}
      />
      
      <CardPaymentSheet
        open={showCardSheet}
        onOpenChange={setShowCardSheet}
        amount={BOOKING_FEE}
        onConfirm={handleCardConfirm}
        isProcessing={isProcessing}
      />
      
      <WalletPaymentSheet
        open={showWalletSheet}
        onOpenChange={setShowWalletSheet}
        amount={BOOKING_FEE}
        onConfirm={handleWalletConfirm}
        isProcessing={isProcessing}
      />

      {/* Processing Overlay */}
      <PaymentProcessingOverlay
        isVisible={showProcessingOverlay}
        onComplete={processPayment}
        paymentMethod={paymentDetails.method}
        amount={BOOKING_FEE}
      />
    </>
  );
};

export default PaymentPage;
