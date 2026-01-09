import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Smartphone, Bell, Users, Edit, AlertCircle, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { BookingSummaryCard } from "@/components/bookings/BookingSummaryCard";
import { CompanionDetailsDialog, Companion } from "@/components/bookings/CompanionDetailsDialog";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useActiveBooking } from "@/hooks/useActiveBooking";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const BookingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const { items, totalPrice } = useCart();
  const { hasActiveBooking, activeBooking, isLoading: bookingCheckLoading } = useActiveBooking(user?.id || null);
  const { isOpen, isLoading: statusLoading, nextOpenInfo } = useSalonOpenStatus(id);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Party size state
  const [partyType, setPartyType] = useState<"alone" | "group">("alone");
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showCompanionDialog, setShowCompanionDialog] = useState(false);

  const partySize = partyType === "alone" ? 1 : companions.length + 1;

  // Redirect if salon is closed
  useEffect(() => {
    if (!statusLoading && isOpen === false) {
      toast.error(`This salon is currently closed. ${nextOpenInfo || 'Please try again later.'}`);
      navigate(`/salon/${id}`);
    }
  }, [isOpen, statusLoading, nextOpenInfo, navigate, id]);

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
        if (data) {
          setContactName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
          setContactPhone(data.phone || '');
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  if (loading || bookingCheckLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const bookingFee = 10; // ₹10 booking fee

  const handleBooking = async () => {
    if (!user || items.length === 0) return;
    
    // Validate companions if group booking
    if (partyType === "group" && companions.length === 0) {
      toast.error("Please add companion details");
      setShowCompanionDialog(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Validate contact details
      if (!contactName.trim() || !contactPhone.trim()) {
        throw new Error('Please fill in contact details');
      }

      // Get the customer record for the current user
      if (!userProfile?.id) {
        throw new Error('Customer profile not found. Please try again.');
      }

      // Create booking record with pending status - use local date to avoid timezone issues
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: userProfile.id,
          salon_id: id,
          service_id: items[0].id,
          booking_date: format(new Date(), 'yyyy-MM-dd'), // Local date, not UTC
          booking_time: new Date().toTimeString().split(' ')[0],
          duration: items.reduce((total, item) => total + (parseInt(item.duration) * item.quantity), 0),
          total_price: bookingFee,
          status: 'pending',
          notes: `Contact: ${contactName} - ${contactPhone}`,
          party_size: partySize
        })
        .select()
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingData) throw new Error('Failed to create booking');

      // Insert companions if any
      if (companions.length > 0) {
        const companionRecords = companions.map((c) => ({
          booking_id: bookingData.id,
          name: c.name.trim(),
          phone: c.phone.trim()
        }));
        
        const { error: companionError } = await supabase
          .from('booking_companions')
          .insert(companionRecords);
          
        if (companionError) {
          console.error('Companion insert error:', companionError);
          // Don't fail the booking, just log the error
        }
      }

      toast.success('Booking details saved! Please complete payment.');
      navigate(`/payment/${bookingData.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompanionConfirm = (newCompanions: Companion[]) => {
    setCompanions(newCompanions);
    setShowCompanionDialog(false);
  };

  const handlePartyTypeChange = (value: string) => {
    setPartyType(value as "alone" | "group");
    if (value === "group") {
      setShowCompanionDialog(true);
    } else {
      setCompanions([]);
    }
  };

  return (
    <CustomerLayout
      headerProps={{
        title: "Book Service",
        showBackButton: true,
        showProfile: false,
        showNotifications: false
      }}
      bottomButtonProps={{
        text: isProcessing ? "Processing..." : "Confirm Booking",
        onClick: handleBooking,
        disabled: isProcessing || !contactName.trim() || !contactPhone.trim() || hasActiveBooking || (partyType === "group" && companions.length === 0)
      }}
    >
      {/* Companion Details Dialog */}
      <CompanionDetailsDialog
        isOpen={showCompanionDialog}
        onClose={() => {
          setShowCompanionDialog(false);
          if (companions.length === 0) {
            setPartyType("alone");
          }
        }}
        onConfirm={handleCompanionConfirm}
        initialCompanions={companions}
      />

      {/* Active Booking Warning */}
      {hasActiveBooking && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You already have an active booking at {activeBooking?.salons?.name}. 
            Please complete or cancel it before booking another salon.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-hero text-white p-4">        
        <div className="text-center">
          <h2 className="text-xl font-bold">Style Studio</h2>
          <p className="text-white/90">Complete your booking</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Booking Summary Card */}
        {items.length > 0 && (
          <BookingSummaryCard
            serviceName={items[0]?.name || "Service"}
            servicePrice={totalPrice}
            bookingFee={bookingFee}
          />
        )}

        {/* Contact Details Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Contact Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-primary"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can book for someone else by editing these details
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{contactName || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{contactPhone || "Not provided"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Number of People Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Number of People</h3>
            
            <RadioGroup
              value={partyType}
              onValueChange={handlePartyTypeChange}
              className="space-y-3"
            >
              <label
                htmlFor="alone"
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  partyType === "alone"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="alone" id="alone" />
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Just me</p>
                  <p className="text-sm text-muted-foreground">Booking for yourself only</p>
                </div>
              </label>
              
              <label
                htmlFor="group"
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  partyType === "group"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="group" id="group" />
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">With others</p>
                  <p className="text-sm text-muted-foreground">Booking for multiple people</p>
                </div>
              </label>
            </RadioGroup>

            {/* Show companions summary if group booking */}
            {partyType === "group" && companions.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    👥 {partySize} people total
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompanionDialog(true)}
                    className="text-primary h-auto p-1"
                  >
                    Edit
                  </Button>
                </div>
                <div className="space-y-1">
                  {companions.map((c, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      • {c.name} ({c.phone})
                    </p>
                  ))}
                </div>
              </div>
            )}

            {partyType === "group" && companions.length === 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowCompanionDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Companion Details
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 3. Booking Summary Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking Fee</span>
                <span className="font-medium">₹{bookingFee}</span>
              </div>
              {partySize > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Party Size</span>
                  <span className="font-medium">{partySize} people</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>₹{bookingFee}</span>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Pay ₹10 booking fee now. Service charges will be paid at the salon.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Notification Reminder Section */}
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

        {/* 5. Confirm Booking Button - Now handled by CustomerLayout */}
        <div className="pt-2 pb-6">
          {/* Fixed button is now handled by CustomerLayout */}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default BookingScreen;