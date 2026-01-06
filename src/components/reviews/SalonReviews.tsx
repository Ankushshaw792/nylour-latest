import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface SalonReviewsProps {
  salonId: string;
}

export const SalonReviews = ({ salonId }: SalonReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("reviews")
          .select("id, rating, comment, created_at, customer_id")
          .eq("salon_id", salonId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        const reviewData = data as any[];
        if (reviewData && reviewData.length > 0) {
          // Fetch customer names
          const customerIds = reviewData.map((r: any) => r.customer_id);
          const { data: customers } = await (supabase as any)
            .from("customers")
            .select("user_id, first_name, last_name")
            .in("user_id", customerIds);

          const enrichedReviews = reviewData.map((review: any) => ({
            ...review,
            customer: customers?.find((c: any) => c.user_id === review.customer_id),
          }));

          setReviews(enrichedReviews);

          // Calculate average rating
          const avg = reviewData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewData.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [salonId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-24 bg-muted rounded"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average Rating Summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          <span className="text-2xl font-bold">{averageRating}</span>
        </div>
        <span className="text-muted-foreground">
          ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
        </span>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {reviews.map((review) => {
          const customerName = review.customer
            ? `${review.customer.first_name || ""} ${review.customer.last_name || ""}`.trim() ||
              "Anonymous"
            : "Anonymous";

          return (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{customerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
