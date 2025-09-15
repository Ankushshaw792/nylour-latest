import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CreditCard, Smartphone, Bell, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BookingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const { items, totalPrice } = useCart();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [paymentOption, setPaymentOption] = useState("now"); // "now" or "salon"
  const [paymentMethod, setPaymentMethod] = useState("upi"); // "upi", "card", "wallet"
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch user profile to get mobile number
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const bookingFee = 25; // ₹25 booking fee as shown in image
  const serviceTotal = totalPrice;
  const finalAmount = paymentOption === "now" ? serviceTotal + bookingFee : bookingFee;

  const handleBooking = async () => {
    if (!user || items.length === 0) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Create booking record
      // Ensure we have valid data
      if (!id || items.length === 0) {
        throw new Error('Missing required booking information');
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          salon_id: id,
          service_id: items[0].id, // Now correctly references services.id
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: new Date().toTimeString().split(' ')[0],
          duration: items.reduce((total, item) => total + (parseInt(item.duration) * item.quantity), 0),
          total_price: finalAmount,
          status: 'confirmed',
          payment_status: paymentOption === 'now' ? 'completed' : 'pending'
        })
        .select()
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingData) throw new Error('Failed to create booking');

      // Payment tracking - store in booking record for now
      // Update booking with payment info
      if (paymentOption === 'now') {
        await supabase
          .from('bookings')
          .update({ 
            payment_status: 'completed',
            salon_notes: `Payment: ${paymentMethod.toUpperCase()} - ₹${finalAmount}`
          })
          .eq('id', bookingData.id);
      }

      // Create queue entry
      const { error: queueError } = await supabase
        .from('queue_entries')
        .insert({
          salon_id: id,
          customer_id: user.id,
          service_id: items[0].id,
          queue_number: Math.floor(Math.random() * 1000) + 1,
          status: 'waiting'
        });

      if (queueError) throw queueError;

      toast.success('Booking confirmed successfully!');
      navigate(`/booking-confirmation/${bookingData.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="mobile-icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Book Service</h1>
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-bold">Style Studio</h2>
          <p className="text-white/90">Complete your booking</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 1. Booking Summary Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
            
            {/* Services List */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.duration} • Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />
            
            {/* Live Position and Wait Time */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Your current live position</p>
                    <p className="text-2xl font-bold text-blue-600">#3 in queue</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Estimated wait time</p>
                  <p className="text-2xl font-bold text-green-600">25 min</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Your Details Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Your Details</h3>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{userProfile?.phone || "+91 98765 43210"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Payment Details Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Payment Details</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Price</span>
                <span className="font-medium">₹{serviceTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking Fee</span>
                <span className="font-medium">₹{bookingFee}</span>
              </div>
            </div>

            {/* Pay Now vs Pay at Salon */}
            <div className="space-y-3">
              <div 
                className={`p-3 border rounded-lg cursor-pointer transition-all ${paymentOption === "now" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-border"}`}
                onClick={() => setPaymentOption("now")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pay Now</p>
                    <p className="text-sm text-muted-foreground">Pay full amount online</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{serviceTotal + bookingFee}</p>
                    {paymentOption === "now" && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto mt-1" />}
                  </div>
                </div>
              </div>

              <div 
                className={`p-3 border rounded-lg cursor-pointer transition-all ${paymentOption === "salon" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-border"}`}
                onClick={() => setPaymentOption("salon")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pay at Salon</p>
                    <p className="text-sm text-muted-foreground">Pay booking fee now, rest at salon</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{bookingFee}</p>
                    {paymentOption === "salon" && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto mt-1" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Fee Policy */}
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Booking Fee Policy:</strong> Non-refundable booking fee to secure your slot. 
                {paymentOption === "salon" && " Remaining amount to be paid at the salon."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Payment Method Section */}
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

        {/* 5. Notification Reminder Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Notification Reminder</h3>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">SMS Alerts</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You'll receive SMS updates about your queue position and a 15-minute alert before your turn.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Pay Now Button */}
        <div className="pt-2 pb-4">
          <Button
            variant="gradient"
            size="xl"
            className="w-full"
            onClick={handleBooking}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay ₹{finalAmount} Now
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingScreen;