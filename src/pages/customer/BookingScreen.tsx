import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CreditCard, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const services = [
  { id: "haircut", name: "Haircut", price: 299, duration: "30 min", icon: Scissors },
  { id: "beard", name: "Beard Trim", price: 149, duration: "15 min", icon: Sparkles },
  { id: "wash", name: "Hair Wash", price: 99, duration: "20 min", icon: Sparkles },
];

const timeSlots = [
  "Now", "10:00 AM", "10:30 AM", "11:00 AM", 
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM"
];

const BookingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState("haircut");
  const [selectedTime, setSelectedTime] = useState("Now");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const selectedServiceData = services.find(s => s.id === selectedService);
  const bookingFee = 10; // ₹10 booking fee
  const totalAmount = (selectedServiceData?.price || 0) + bookingFee;

  const handleBooking = async () => {
    setIsProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      navigate(`/booking-confirmation/${id}`);
    }, 2000);
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

      <div className="p-4 space-y-6">
        {/* Service Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Select Service</h3>
            <RadioGroup value={selectedService} onValueChange={setSelectedService}>
              {services.map((service) => (
                <div key={service.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                  <RadioGroupItem value={service.id} id={service.id} />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <service.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={service.id} className="font-medium cursor-pointer">
                        {service.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{service.duration}</p>
                    </div>
                    <span className="font-bold text-primary">₹{service.price}</span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Select Time</h3>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="text-xs"
                >
                  {time}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>{selectedServiceData?.name}</span>
                <span>₹{selectedServiceData?.price}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Booking Fee</span>
                <span>₹{bookingFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wait Time Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Expected Wait Time</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTime === "Now" ? "15 minutes" : `Available at ${selectedTime}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <div className="space-y-3">
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
                Pay ₹{totalAmount} & Book
              </div>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            You'll receive SMS updates about your booking
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingScreen;