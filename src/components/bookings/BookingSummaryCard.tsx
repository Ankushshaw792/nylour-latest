import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingSummaryCardProps {
  serviceName: string;
  servicePrice: number;
  bookingFee?: number;
}

export const BookingSummaryCard = ({ 
  serviceName, 
  servicePrice, 
  bookingFee = 10 
}: BookingSummaryCardProps) => {
  const totalAmount = servicePrice + bookingFee;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{serviceName}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Service Price</span>
          <span className="font-medium">₹{servicePrice}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Booking Fee</span>
          <span className="font-medium">₹{bookingFee}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-xl font-bold text-primary">₹{totalAmount}</span>
        </div>
      </CardContent>
    </Card>
  );
};
