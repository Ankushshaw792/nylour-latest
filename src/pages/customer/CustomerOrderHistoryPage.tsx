import { useState, useEffect } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Store, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string | null;
  status: string | null;
  total_price: number | null;
  salon: { name: string } | null;
  service: { name: string } | null;
}

type FilterStatus = "all" | "completed" | "cancelled" | "pending";

const CustomerOrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        // First get customer ID
        const { data: customer } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!customer) {
          setLoading(false);
          return;
        }

        // Fetch bookings with salon and service names
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            booking_date,
            booking_time,
            status,
            total_price,
            salon_id,
            service_id
          `)
          .eq("customer_id", customer.id)
          .order("booking_date", { ascending: false });

        if (error) throw error;

        // Fetch salon and service names separately
        const bookingsWithDetails = await Promise.all(
          (data || []).map(async (booking) => {
            let salonName = null;
            let serviceName = null;

            if (booking.salon_id) {
              const { data: salon } = await supabase
                .from("salons")
                .select("name")
                .eq("id", booking.salon_id)
                .maybeSingle();
              salonName = salon?.name || null;
            }

            if (booking.service_id) {
              const { data: service } = await supabase
                .from("services")
                .select("name")
                .eq("id", booking.service_id)
                .maybeSingle();
              serviceName = service?.name || null;
            }

            return {
              ...booking,
              salon: salonName ? { name: salonName } : null,
              service: serviceName ? { name: serviceName } : null,
            };
          })
        );

        setBookings(bookingsWithDetails);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Confirmed</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

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
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Order History</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-1">No bookings found</h3>
            <p className="text-sm text-muted-foreground">
              {filter === "all" 
                ? "You haven't made any bookings yet" 
                : `No ${filter} bookings`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {booking.salon?.name || "Unknown Salon"}
                      </span>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(booking.booking_date), "dd MMM yyyy")}</span>
                      {booking.booking_time && (
                        <>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{booking.booking_time}</span>
                        </>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                      <span className="text-muted-foreground">
                        {booking.service?.name || "Service"}
                      </span>
                      <span className="font-semibold text-foreground">
                        ₹{booking.total_price || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrderHistoryPage;
