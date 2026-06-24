import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, User, Users } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface SelectStylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string | undefined;
  avgServiceTime: number;
  onSelect: (staffId: string) => void;
}

export const SelectStylistDialog: React.FC<SelectStylistDialogProps> = ({
  isOpen,
  onClose,
  salonId,
  avgServiceTime,
  onSelect,
}) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("any");
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen || !salonId) return;

    const fetchStaffAndQueue = async () => {
      setLoading(true);
      try {
        // Fetch active staff
        const { data: staffData, error: staffError } = await supabase
          .from("salon_staff")
          .select("*")
          .eq("salon_id", salonId)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (staffError) throw staffError;

        // Fetch active queue entries to calculate stylist queue sizes
        const { data: queueData, error: queueError } = await supabase
          .from("queue_entries")
          .select("id, staff_id")
          .eq("salon_id", salonId)
          .in("status", ["waiting", "called", "in_service"]);

        if (queueError) throw queueError;

        // Map queue counts
        const counts: Record<string, number> = {};
        staffData?.forEach((s) => {
          counts[s.id] = (queueData || []).filter((q) => q.staff_id === s.id).length;
        });

        setStaff(staffData || []);
        setQueueCounts(counts);
      } catch (error) {
        console.error("Error loading staff data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffAndQueue();
  }, [isOpen, salonId]);

  // Determine the least wait time/queue count for "Any Stylist"
  const getAnyStylistQueueInfo = () => {
    const counts = Object.values(queueCounts);
    if (counts.length === 0) return { queueCount: 0, waitTime: 0 };
    const minQueue = Math.min(...counts);
    return {
      queueCount: minQueue,
      waitTime: minQueue * avgServiceTime,
    };
  };

  const anyStylistInfo = getAnyStylistQueueInfo();

  const handleConfirm = () => {
    onSelect(selectedStaffId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Select Stylist
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose your preferred stylist or select Any Stylist for the fastest service.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching stylists...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No stylists available</p>
              <p className="text-xs text-muted-foreground mt-1">Please proceed with Any Stylist.</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
              className="space-y-3"
            >
              {/* Any Stylist Option */}
              <Label
                htmlFor="staff-any"
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedStaffId === "any"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30 bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/20 bg-primary/10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      Any Stylist
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {anyStylistInfo.queueCount > 0 
                        ? `Fastest option (${anyStylistInfo.queueCount} in queue)` 
                        : "First available (No wait time)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 rounded-full border border-green-100 dark:border-green-900">
                      {anyStylistInfo.waitTime > 0 ? `~${anyStylistInfo.waitTime} min` : "0 min"}
                    </span>
                  </div>
                  <RadioGroupItem value="any" id="staff-any" className="text-primary" />
                </div>
              </Label>

              {/* Individual Stylists */}
              {staff.map((s) => {
                const qCount = queueCounts[s.id] || 0;
                const waitMin = qCount * avgServiceTime;
                const isSelected = selectedStaffId === s.id;

                return (
                  <Label
                    key={s.id}
                    htmlFor={`staff-${s.id}`}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border">
                        {s.avatar_url && <AvatarImage src={s.avatar_url} />}
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                          {s.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {qCount > 0 ? `${qCount} in queue` : "No one waiting"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          qCount > 0 
                            ? "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900" 
                            : "text-green-600 bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900"
                        }`}>
                          {waitMin > 0 ? `~${waitMin} min` : "0 min"}
                        </span>
                      </div>
                      <RadioGroupItem value={s.id} id={`staff-${s.id}`} className="text-primary" />
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          )}
        </div>

        <Button
          onClick={handleConfirm}
          className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 py-6 rounded-xl font-semibold text-sm"
          disabled={loading}
        >
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};
