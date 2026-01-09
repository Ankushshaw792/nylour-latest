import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Gift, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Toggle this to false when ready to charge users
const FREE_BOOKING_MODE = true;
const BOOKING_FEE = 10;

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const [booking, setBooking] = useState<any>(null);
  const [salon, setSalon] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleFreeBooking = async () => {
    if (!booking || !user || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Update booking with free promotion details
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'completed',
          payment_method: 'free_promotion',
          payment_reference: `FREE${Date.now().toString().slice(-8)}`,
          notes: 'Free booking - Launch promotion'
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      toast.success('Booking confirmed!');
      navigate(`/booking-confirmation/${booking.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsProcessing(false);
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
        title: "Confirm Booking",
        showBackButton: true,
        showProfile: false,
        showNotifications: false
      }}
      bottomButtonProps={{
        text: isProcessing ? "Confirming..." : "Book for Free",
        onClick: handleFreeBooking,
        disabled: isProcessing,
        variant: "success"
      }}
    >
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white p-4">        
        <div className="text-center">
          <h2 className="text-xl font-bold">{salon?.name}</h2>
          <p className="text-white/90">Confirm your booking</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Free Promo Banner */}
        {FREE_BOOKING_MODE && (
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-green-800 dark:text-green-200">Launch Offer!</h3>
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Free bookings during our launch period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking Fee</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">₹{BOOKING_FEE}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    FREE
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-green-600">₹0</span>
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> Service charges will be paid directly at the salon after your appointment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Spacer for bottom button */}
        <div className="h-20" />
      </div>
    </CustomerLayout>
  );
};

export default PaymentPage;
