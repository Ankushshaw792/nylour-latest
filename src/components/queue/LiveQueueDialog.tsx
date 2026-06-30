import { useState, useEffect, useCallback } from "react";
import { Users, Clock, Loader2, ArrowLeft, Sparkles, User, Scissors } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface StaffMember {
  id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface QueueEntry {
  id: string;
  position: number;
  customer_name: string;
  avatar_url: string | null;
  service_name: string;
  estimated_wait: number;
  party_size: number;
  queue_status: string;
}

interface LiveQueueDialogProps {
  salonId: string;
  isOpen: boolean;
  onClose: () => void;
  avgServiceTime: number;
}

export const LiveQueueDialog = ({
  salonId,
  isOpen,
  onClose,
  avgServiceTime,
}: LiveQueueDialogProps) => {
  // Stage management: null = show stylist list, non-null = show specific stylist's queue
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  
  // Data states
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [stylistQueue, setStylistQueue] = useState<QueueEntry[]>([]);
  
  // Loading states
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Fetch all active stylists and compute their queue sizes (Stage 1)
  const fetchStaffAndCounts = useCallback(async () => {
    if (!salonId) return;
    try {
      setLoadingStaff(true);
      
      // 1. Fetch active stylists
      const { data: staffData, error: staffError } = await supabase
        .from("salon_staff")
        .select("*")
        .eq("salon_id", salonId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (staffError) throw staffError;

      // 2. Fetch active queue entries to compute sizes
      const { data: queueData, error: queueError } = await supabase
        .from("queue_entries")
        .select("id, staff_id")
        .eq("salon_id", salonId)
        .in("status", ["waiting", "called", "in_service"]);

      if (queueError) throw queueError;

      const counts: Record<string, number> = {};
      staffData?.forEach((s) => {
        counts[s.id] = (queueData || []).filter((q) => q.staff_id === s.id).length;
      });

      setStaffList(staffData || []);
      setQueueCounts(counts);
    } catch (error) {
      console.error("Error fetching staff queue counts:", error);
    } finally {
      setLoadingStaff(false);
    }
  }, [salonId]);

  // Fetch queue entries for a specific stylist (Stage 2)
  const fetchStylistQueue = useCallback(async (staffId: string) => {
    try {
      setLoadingQueue(true);
      
      // Call get_queue_display RPC filtered by p_staff_id
      const { data, error } = await supabase.rpc('get_queue_display', {
        p_salon_id: salonId,
        p_staff_id: staffId
      });

      if (error) throw error;

      const processedQueue: QueueEntry[] = (data || []).map((entry: any, index: number) => ({
        id: entry.queue_entry_id,
        position: entry.queue_position || index + 1,
        customer_name: entry.display_name || "Customer",
        avatar_url: entry.avatar_url || null,
        service_name: entry.service_summary || "Service",
        estimated_wait: entry.estimated_wait_time ?? (index * avgServiceTime),
        party_size: entry.party_size || 1,
        queue_status: entry.queue_status || 'waiting',
      }));

      setStylistQueue(processedQueue);
    } catch (error) {
      console.error("Error fetching stylist queue:", error);
    } finally {
      setLoadingQueue(false);
    }
  }, [salonId, avgServiceTime]);

  // Main coordinator effect
  useEffect(() => {
    if (!isOpen || !salonId) return;

    // 1. Initial fetch for Stage 1
    fetchStaffAndCounts();

    // 2. If a stylist is already selected, fetch their queue
    if (selectedStaff) {
      fetchStylistQueue(selectedStaff.id);
    }

    // 3. Set up real-time Postgres channel to listen for queue changes
    const channel = supabase
      .channel(`live-queue-dialog-${salonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: `salon_id=eq.${salonId}` },
        () => {
          // Refetch both counts and specific queue on any update
          fetchStaffAndCounts();
          if (selectedStaff) {
            fetchStylistQueue(selectedStaff.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, salonId, selectedStaff, fetchStaffAndCounts, fetchStylistQueue]);

  // Reset stage when dialog closes
  const handleClose = () => {
    setSelectedStaff(null);
    setStylistQueue([]);
    onClose();
  };

  const handleSelectStylist = (staff: StaffMember) => {
    setSelectedStaff(staff);
    fetchStylistQueue(staff.id);
  };

  const handleBackToStylists = () => {
    setSelectedStaff(null);
    setStylistQueue([]);
    fetchStaffAndCounts();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-6 rounded-2xl">
        
        {/* Stage 1 Header */}
        {!selectedStaff ? (
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Live Queue Status
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Check the active queues and wait times for each stylist.
            </DialogDescription>
          </DialogHeader>
        ) : (
          /* Stage 2 Header */
          <DialogHeader className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToStylists}
                className="h-8 w-8 rounded-lg -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Avatar className="w-6 h-6 border border-border">
                  {selectedStaff.avatar_url && <AvatarImage src={selectedStaff.avatar_url} />}
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {selectedStaff.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {selectedStaff.name}'s Queue
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Showing active bookings waiting for {selectedStaff.name}.
            </DialogDescription>
          </DialogHeader>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 py-1">
          
          {/* STAGE 1: Stylist Selector */}
          {!selectedStaff ? (
            loadingStaff ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading stylists...</p>
              </div>
            ) : staffList.length === 0 ? (
              <div className="text-center py-10">
                <User className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-medium text-muted-foreground text-sm">No stylists active</p>
                <p className="text-xs text-muted-foreground mt-1">There are no stylists online at the moment.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {staffList.map((s) => {
                  const count = queueCounts[s.id] || 0;
                  const wait = count * avgServiceTime;
                  
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStylist(s)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border group-hover:scale-105 transition-transform">
                          {s.avatar_url && <AvatarImage src={s.avatar_url} />}
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                            {s.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                            {s.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {count > 0 ? `${count} waiting` : "No one waiting"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          count > 0 
                            ? "border-primary/20 bg-primary/5 text-primary" 
                            : "border-emerald-100 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                        }`}>
                          {wait > 0 ? `~${wait} min` : "0 min"}
                        </Badge>
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            
            /* STAGE 2: Stylist-specific Queue */
            loadingQueue ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading queue...</p>
              </div>
            ) : stylistQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-10 w-10 text-emerald-500/60 mb-2.5" />
                <p className="text-foreground font-semibold text-sm">Stylist Queue is Empty</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  {selectedStaff.name} is currently free with no wait time. Book now for immediate service!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(() => {
                  const firstWaitingIndex = stylistQueue.findIndex(entry => entry.queue_status !== 'in_service');
                  
                  return stylistQueue.map((entry, idx) => {
                    const isInService = entry.queue_status === 'in_service';
                    const isFirstWaiting = idx === firstWaitingIndex;
                    
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                          isInService
                            ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900"
                            : isFirstWaiting
                              ? "bg-primary/10 dark:bg-primary/5 border-primary/30"
                              : "bg-muted/30 border-border/60"
                        }`}
                      >
                        {/* Queue Position Avatar */}
                        <Avatar className={`w-9 h-9 border ${
                          isInService 
                            ? "ring-2 ring-green-500" 
                            : isFirstWaiting 
                              ? "ring-2 ring-primary" 
                              : "border-border"
                        }`}>
                          <AvatarImage src={entry.avatar_url ?? undefined} />
                          <AvatarFallback
                            className={`font-bold text-xs ${
                              isInService
                                ? "bg-green-500 text-white"
                                : isFirstWaiting
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </AvatarFallback>
                        </Avatar>

                        {/* Customer & Service Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground text-sm truncate">{entry.customer_name}</p>
                            {entry.party_size > 1 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                +{entry.party_size - 1}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.service_name}
                          </p>
                        </div>

                        {/* Estimated Wait Time */}
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0 bg-background/60 px-2.5 py-1 rounded-lg border border-border/30">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>
                            {isInService 
                              ? "In Service" 
                              : entry.estimated_wait === 0 
                                ? "Now" 
                                : `~${entry.estimated_wait} min`
                            }
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple ChevronRight icon helper
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
