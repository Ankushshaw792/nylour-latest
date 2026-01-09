import { useState, useEffect } from "react";
import { Users, Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface QueueEntry {
  id: string;
  position: number;
  customer_name: string;
  avatar_url: string | null;
  service_name: string;
  estimated_wait: number;
  status: string;
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
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      const { data, error } = await supabase
        .from("queue_entries")
        .select(`
          id,
          position,
          status,
          customer_id,
          booking_id,
        customers (
          first_name,
          last_name,
          avatar_url
        ),
          bookings (
            salon_services (
              services (
                name
              )
            )
          )
        `)
        .eq("salon_id", salonId)
        .eq("status", "waiting")
        .gte("check_in_time", todayStart)
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching queue:", error);
        return;
      }

      const processedQueue: QueueEntry[] = (data || []).map((entry: any, index: number) => {
        const firstName = entry.customers?.first_name || "Customer";
        const lastInitial = entry.customers?.last_name ? entry.customers.last_name.charAt(0) + "." : "";
        const serviceName = entry.bookings?.salon_services?.services?.name || "Service";
        
        return {
          id: entry.id,
          position: entry.position || index + 1,
          customer_name: `${firstName} ${lastInitial}`.trim(),
          avatar_url: entry.customers?.avatar_url || null,
          service_name: serviceName,
          estimated_wait: index * avgServiceTime,
          status: entry.status,
        };
      });

      setQueue(processedQueue);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && salonId) {
      fetchQueue();

      // Set up real-time subscription
      const channel = supabase
        .channel(`salon-queue-${salonId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "queue_entries",
            filter: `salon_id=eq.${salonId}`,
          },
          () => {
            fetchQueue();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, salonId, avgServiceTime]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Live Queue
            <Badge variant="secondary" className="ml-2">
              {queue.length} waiting
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No one in queue</p>
              <p className="text-sm text-muted-foreground">Be the first to book!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    index === 0
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  {/* Customer Avatar */}
                  <Avatar className={`w-8 h-8 ${index === 0 ? "ring-2 ring-primary" : ""}`}>
                    <AvatarImage src={entry.avatar_url || ""} />
                    <AvatarFallback
                      className={`font-bold text-sm ${
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {entry.position}
                    </AvatarFallback>
                  </Avatar>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.customer_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.service_name}
                    </p>
                  </div>

                  {/* Wait Time */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {index === 0 ? "Now" : `~${entry.estimated_wait} min`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
