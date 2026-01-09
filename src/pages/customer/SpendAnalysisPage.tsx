import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Calendar, IndianRupee, XCircle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Period = "monthly" | "quarterly" | "annually";

interface SpendStats {
  totalVisits: number;
  totalSpent: number;
  cancellations: number;
  avgPerVisit: number;
}

const SpendAnalysisPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SpendStats>({
    totalVisits: 0,
    totalSpent: 0,
    cancellations: 0,
    avgPerVisit: 0,
  });
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Get date range based on period
  const getDateRange = (p: Period) => {
    const now = new Date();
    let startDate: Date;

    switch (p) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "annually":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return startDate.toISOString().split("T")[0];
  };

  // Fetch customer ID
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("customers")
        .select("id, cancellation_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setCustomerId(data.id);
        setStats((prev) => ({ ...prev, cancellations: data.cancellation_count || 0 }));
      }
    };

    fetchCustomerId();
  }, [user]);

  // Fetch spend stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!customerId) return;
      setLoading(true);

      const startDate = getDateRange(period);

      try {
        // Get completed bookings count and total
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("total_price")
          .eq("customer_id", customerId)
          .eq("status", "completed")
          .gte("booking_date", startDate);

        if (error) throw error;

        const totalVisits = bookings?.length || 0;
        const totalSpent = bookings?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0;
        const avgPerVisit = totalVisits > 0 ? totalSpent / totalVisits : 0;

        setStats((prev) => ({
          ...prev,
          totalVisits,
          totalSpent,
          avgPerVisit,
        }));
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [customerId, period]);

  // Real-time subscription for bookings
  useEffect(() => {
    if (!customerId) return;

    const channel = supabase
      .channel("spend-analysis-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          // Refetch stats on any booking change
          const startDate = getDateRange(period);
          supabase
            .from("bookings")
            .select("total_price")
            .eq("customer_id", customerId)
            .eq("status", "completed")
            .gte("booking_date", startDate)
            .then(({ data }) => {
              if (data) {
                const totalVisits = data.length;
                const totalSpent = data.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
                const avgPerVisit = totalVisits > 0 ? totalSpent / totalVisits : 0;
                setStats((prev) => ({ ...prev, totalVisits, totalSpent, avgPerVisit }));
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, period]);

  const getPeriodLabel = () => {
    switch (period) {
      case "monthly":
        return "This Month";
      case "quarterly":
        return "This Quarter";
      case "annually":
        return "This Year";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Spend Analysis</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="annually">Annually</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period Label */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{getPeriodLabel()}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.totalVisits}</p>
                      <p className="text-xs text-muted-foreground">Total Visits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">₹{stats.totalSpent.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.cancellations}</p>
                      <p className="text-xs text-muted-foreground">Cancellations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">₹{stats.avgPerVisit.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Avg/Visit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Period</span>
                  <span className="text-sm font-medium">{getPeriodLabel()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Completed Visits</span>
                  <span className="text-sm font-medium">{stats.totalVisits}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-sm font-medium text-green-600">₹{stats.totalSpent.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Average per Visit</span>
                  <span className="text-sm font-medium">₹{stats.avgPerVisit.toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default SpendAnalysisPage;
