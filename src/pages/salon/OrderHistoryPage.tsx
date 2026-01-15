import { useState, useEffect } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { ArrowLeft, History, Calendar, Clock, User, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  customers: {
    first_name: string;
    last_name: string;
  } | null;
  salon_services: {
    services: {
      name: string;
    } | null;
  } | null;
}

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!salonData) return;

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            booking_time,
            status,
            total_price,
            customers (first_name, last_name),
            salon_services!bookings_service_id_fkey (
              services (name)
            )
          `)
          .eq('salon_id', salonData.id)
          .order('booking_date', { ascending: false })
          .order('booking_time', { ascending: false })
          .limit(50);

        if (bookingsData) {
          setBookings(bookingsData as unknown as Booking[]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'confirmed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SalonLoader size="lg" text="Loading orders..." />
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
          <h1 className="text-lg font-semibold text-foreground">Order History</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {bookings.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {bookings.length} recent orders
              </p>
            </div>

            {bookings.map((booking) => (
              <Card key={booking.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {booking.customers
                            ? `${booking.customers.first_name || ''} ${booking.customers.last_name || ''}`.trim() || 'Walk-in'
                            : 'Walk-in'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.salon_services?.services?.name || 'Service'}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(booking.status || 'pending')}>
                      {booking.status || 'pending'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                      </span>
                      {booking.booking_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {booking.booking_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    {booking.total_price && (
                      <span className="flex items-center font-medium text-foreground">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {booking.total_price}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
