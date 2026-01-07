import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const [booking, setBooking] = useState<any>(null);
  const [salon, setSalon] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !user) return;

      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          salons (name, address)
        `)
        .eq('id', bookingId)
        .eq('customer_id', user.id)
        .maybeSingle();

      if (bookingData) {
        setBooking(bookingData);
        setSalon(bookingData.salons);
      }
    };

    fetchBookingDetails();
  }, [bookingId, user]);

  const handlePayment = async () => {
    if (!booking || !user) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Update booking status to confirmed and payment status to completed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'completed',
          salon_notes: `Payment: ${paymentMethod.toUpperCase()} - ₹10`
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Create queue entry - get next position first
      const { data: existingQueue } = await supabase
        .from('queue_entries')
        .select('position')
        .eq('salon_id', booking.salon_id)
        .eq('status', 'waiting')
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (existingQueue?.[0]?.position || 0) + 1;

      const { error: queueError } = await supabase
        .from('queue_entries')
        .insert({
          salon_id: booking.salon_id,
          customer_id: user.id,
          booking_id: booking.id,
          position: nextPosition,
          status: 'waiting'
        });

      if (queueError) throw queueError;

      toast.success('Payment successful! Your booking is confirmed.');
      navigate(`/booking-confirmation/${booking.id}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <CustomerLayout
      headerProps={{
        title: "Payment",
        showBackButton: true,
        showProfile: false,
        showNotifications: false
      }}
      bottomButtonProps={{
        text: isProcessingPayment ? "Processing Payment..." : "Pay ₹10 Now",
        onClick: handlePayment,
        disabled: isProcessingPayment
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
                <span className="font-medium">₹10</span>
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>₹10</span>
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
            <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="upi" id="upi" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-600">UPI</span>
                    </div>
                    <Label htmlFor="upi" className="font-medium cursor-pointer">UPI</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="card" id="card" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <Label htmlFor="card" className="font-medium cursor-pointer">Credit / Debit Card</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">₹</span>
                    </div>
                    <Label htmlFor="wallet" className="font-medium cursor-pointer">Digital Wallet</Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Pay Button - Now handled by CustomerLayout */}
        <div className="pt-2 pb-6">
          {/* Fixed button is now handled by CustomerLayout */}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default PaymentPage;