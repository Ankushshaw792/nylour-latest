import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UnreviewedBooking {
  id: string;
  salon_id: string;
  salon_name: string;
  service_name: string;
  completed_at: string;
}

export const useReviewPrompt = () => {
  const { user } = useAuth();
  const [unreviewedBooking, setUnreviewedBooking] = useState<UnreviewedBooking | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  useEffect(() => {
    const checkForUnreviewedBookings = async () => {
      if (!user) return;

      try {
        // Find completed bookings from last 7 days that haven't been reviewed
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: completedBookings, error: bookingsError } = await (supabase as any)
          .from("bookings")
          .select(`
            id,
            salon_id,
            service_id,
            actual_end_time,
            salons (name)
          `)
          .eq("customer_id", user.id)
          .eq("status", "completed")
          .not("actual_end_time", "is", null)
          .gte("actual_end_time", sevenDaysAgo.toISOString())
          .order("actual_end_time", { ascending: false })
          .limit(5);

        if (bookingsError || !completedBookings?.length) return;

        // Check which bookings have already been reviewed
        const bookingIds = completedBookings.map((b: any) => b.id);
        const { data: existingReviews } = await (supabase as any)
          .from("reviews")
          .select("booking_id")
          .in("booking_id", bookingIds);

        const reviewData = existingReviews as any[] || [];
        const reviewedBookingIds = new Set(reviewData.map((r: any) => r.booking_id));

        // Find first unreviewed booking
        const unreviewed = completedBookings.find(
          (b: any) => !reviewedBookingIds.has(b.id)
        );

        if (unreviewed) {
          // Fetch service name
          const { data: serviceData } = await (supabase as any)
            .from("services")
            .select("name")
            .eq("id", unreviewed.service_id)
            .maybeSingle();

          setUnreviewedBooking({
            id: unreviewed.id,
            salon_id: unreviewed.salon_id,
            salon_name: (unreviewed.salons as any)?.name || "Salon",
            service_name: serviceData?.name || "Service",
            completed_at: unreviewed.actual_end_time!,
          });

          // Show review dialog after a short delay
          setTimeout(() => setIsReviewDialogOpen(true), 2000);
        }
      } catch (error) {
        console.error("Error checking for unreviewed bookings:", error);
      }
    };

    checkForUnreviewedBookings();
  }, [user]);

  const dismissReview = () => {
    setIsReviewDialogOpen(false);
    setUnreviewedBooking(null);
  };

  return {
    unreviewedBooking,
    isReviewDialogOpen,
    setIsReviewDialogOpen,
    dismissReview,
  };
};
