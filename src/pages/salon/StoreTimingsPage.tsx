import { useState, useEffect } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { ArrowLeft, Save, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DayHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StoreTimingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [hours, setHours] = useState<DayHours[]>(
    DAYS.map((_, index) => ({
      day_of_week: index,
      open_time: "09:00",
      close_time: "21:00",
      is_closed: false,
    }))
  );

  useEffect(() => {
    const fetchTimings = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!salonData) return;
        setSalonId(salonData.id);

        const { data: hoursData } = await supabase
          .from('salon_hours')
          .select('*')
          .eq('salon_id', salonData.id);

        if (hoursData && hoursData.length > 0) {
          const updatedHours = [...hours];
          hoursData.forEach((h) => {
            updatedHours[h.day_of_week] = {
              day_of_week: h.day_of_week,
              open_time: h.open_time,
              close_time: h.close_time,
              is_closed: h.is_closed || false,
            };
          });
          setHours(updatedHours);
        }
      } catch (error) {
        console.error('Error fetching timings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimings();
  }, [user]);

  const handleSave = async () => {
    if (!salonId) return;
    setSaving(true);

    try {
      // Delete existing hours
      await supabase.from('salon_hours').delete().eq('salon_id', salonId);

      // Insert new hours
      const { error } = await supabase.from('salon_hours').insert(
        hours.map((h) => ({
          salon_id: salonId,
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed,
        }))
      );

      if (error) throw error;

      toast({
        title: "Timings updated",
        description: "Store timings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving timings:', error);
      toast({
        title: "Error",
        description: "Failed to save store timings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateHour = (index: number, field: keyof DayHours, value: string | boolean) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
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
          <h1 className="text-lg font-semibold text-foreground">Store Timings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hours.map((day, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{DAYS[index]}</span>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`closed-${index}`} className="text-xs text-muted-foreground">
                        {day.is_closed ? "Closed" : "Open"}
                      </Label>
                      <Switch
                        id={`closed-${index}`}
                        checked={!day.is_closed}
                        onCheckedChange={(checked) => updateHour(index, 'is_closed', !checked)}
                      />
                    </div>
                  </div>
                  {!day.is_closed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.open_time}
                        onChange={(e) => updateHour(index, 'open_time', e.target.value)}
                        className="text-sm"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        value={day.close_time}
                        onChange={(e) => updateHour(index, 'close_time', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full gap-2">
          <Save className="h-5 w-5" />
          {saving ? "Saving..." : "Save Timings"}
        </Button>
      </div>
    </div>
  );
};

export default StoreTimingsPage;
