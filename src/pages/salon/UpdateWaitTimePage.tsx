import { useState, useEffect } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { ArrowLeft, Timer, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const QUICK_TIMES = [15, 30, 45, 60];

const UpdateWaitTimePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [waitTime, setWaitTime] = useState(30);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWaitTime = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('id, avg_service_time')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (salonData) {
          setSalonId(salonData.id);
          setWaitTime(salonData.avg_service_time ?? 30);
        }
      } catch (error) {
        console.error('Error fetching wait time:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaitTime();
  }, [user]);

  const handleSave = async (time?: number) => {
    if (!salonId) return;
    setSaving(true);

    const timeToSave = time ?? waitTime;

    try {
      const { error } = await supabase
        .from('salons')
        .update({ avg_service_time: timeToSave })
        .eq('id', salonId);

      if (error) throw error;

      if (time) setWaitTime(time);

      toast({
        title: "Wait time updated",
        description: `Current wait time set to ${timeToSave} minutes`,
      });
    } catch (error) {
      console.error('Error saving wait time:', error);
      toast({
        title: "Error",
        description: "Failed to update wait time.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SalonLoader size="lg" text="Loading..." />
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
          <h1 className="text-lg font-semibold text-foreground">Update Wait Time</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Current Wait Time */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-5 w-5" />
              Current Wait Time
            </CardTitle>
            <CardDescription>
              Set the average wait time for customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-4xl font-bold text-primary">{waitTime}</span>
              <span className="text-lg text-muted-foreground ml-2">minutes</span>
            </div>

            <div>
              <Label htmlFor="waitTime">Custom Time (minutes)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="waitTime"
                  type="number"
                  value={waitTime}
                  onChange={(e) => setWaitTime(Number(e.target.value))}
                  min={0}
                  max={180}
                />
                <Button onClick={() => handleSave()} disabled={saving}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Update Buttons */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Update</CardTitle>
            <CardDescription>Tap to quickly set wait time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_TIMES.map((time) => (
                <Button
                  key={time}
                  variant={waitTime === time ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSave(time)}
                  disabled={saving}
                  className="h-14"
                >
                  {time} min
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="border shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-2">Wait Time Guidelines</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Update regularly based on current queue length</li>
              <li>• Consider service complexity and staff availability</li>
              <li>• Accurate wait times improve customer satisfaction</li>
              <li>• Customers receive notifications about wait time changes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateWaitTimePage;
