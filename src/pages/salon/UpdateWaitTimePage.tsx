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
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
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
          const timeVal = salonData.avg_service_time ?? 30;
          setWaitTime(timeVal);
          setHours(Math.floor(timeVal / 60));
          setMinutes(timeVal % 60);
        }
      } catch (error) {
        console.error('Error fetching wait time:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaitTime();
  }, [user]);

  const formatWaitTimeDisplay = (totalMinutes: number) => {
    if (totalMinutes === 0) return "0 minutes";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h === 0) {
      return `${m} minutes`;
    }
    
    const hourText = h === 1 ? "hour" : "hours";
    if (m === 0) {
      return `${h} ${hourText}`;
    }
    return `${h} ${hourText} ${m} minutes`;
  };

  const handleSave = async (time?: number) => {
    if (!salonId) return;
    setSaving(true);

    const timeToSave = time !== undefined ? time : (hours * 60 + minutes);

    try {
      const { error } = await supabase
        .from('salons')
        .update({ avg_service_time: timeToSave })
        .eq('id', salonId);

      if (error) throw error;

      setWaitTime(timeToSave);
      setHours(Math.floor(timeToSave / 60));
      setMinutes(timeToSave % 60);

      toast({
        title: "Wait time updated",
        description: `Current wait time set to ${formatWaitTimeDisplay(timeToSave)}`,
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
              <span className="text-3xl font-bold text-primary">{formatWaitTimeDisplay(waitTime)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="hours">Hours</Label>
                <select
                  id="hours"
                  value={hours}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    setHours(h);
                    setWaitTime(h * 60 + minutes);
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} {h === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minutes">Minutes</Label>
                <select
                  id="minutes"
                  value={minutes}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setMinutes(m);
                    setWaitTime(hours * 60 + m);
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button onClick={() => handleSave()} disabled={saving} className="w-full mt-4 gap-2" size="lg">
              <Save className="h-4 w-4" />
              Save Wait Time
            </Button>
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
