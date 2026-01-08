import { useState, useEffect } from "react";
import { ArrowLeft, Pause, Play, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ScheduleOffPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isAcceptingBookings, setIsAcceptingBookings] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalonStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('id, is_active')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (salonData) {
          setSalonId(salonData.id);
          setIsAcceptingBookings(salonData.is_active ?? true);
        }
      } catch (error) {
        console.error('Error fetching salon status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonStatus();
  }, [user]);

  const toggleBookingStatus = async () => {
    if (!salonId) return;
    setUpdating(true);

    try {
      const newStatus = !isAcceptingBookings;
      const { error } = await supabase
        .from('salons')
        .update({ is_active: newStatus })
        .eq('id', salonId);

      if (error) throw error;

      setIsAcceptingBookings(newStatus);
      toast({
        title: newStatus ? "Bookings resumed" : "Bookings paused",
        description: newStatus
          ? "You are now accepting new bookings."
          : "New bookings are temporarily paused.",
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/salon-dashboard/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Schedule Off</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Current Status Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                Booking Status
              </CardTitle>
              <Badge variant={isAcceptingBookings ? "default" : "destructive"}>
                {isAcceptingBookings ? "Active" : "Paused"}
              </Badge>
            </div>
            <CardDescription>
              Control whether customers can make new bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${isAcceptingBookings ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-medium ${isAcceptingBookings ? 'text-green-800' : 'text-red-800'}`}>
                {isAcceptingBookings
                  ? "You are currently accepting new bookings"
                  : "New bookings are temporarily paused"}
              </p>
              <p className={`text-xs mt-1 ${isAcceptingBookings ? 'text-green-600' : 'text-red-600'}`}>
                {isAcceptingBookings
                  ? "Customers can see your salon and book appointments"
                  : "Customers cannot book new appointments until you resume"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Toggle Button */}
        <Button
          onClick={toggleBookingStatus}
          disabled={updating}
          size="lg"
          variant={isAcceptingBookings ? "destructive" : "default"}
          className="w-full gap-2"
        >
          {isAcceptingBookings ? (
            <>
              <Pause className="h-5 w-5" />
              {updating ? "Pausing..." : "Pause Bookings"}
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              {updating ? "Resuming..." : "Resume Bookings"}
            </>
          )}
        </Button>

        {/* Info Card */}
        <Card className="border shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">When to use this feature</p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• During rush hours when queue is full</li>
                  <li>• When taking a break or lunch</li>
                  <li>• For unexpected closures</li>
                  <li>• Staff shortage situations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleOffPage;
