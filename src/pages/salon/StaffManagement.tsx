import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Users, AlertCircle, Sparkles, Clock, Check, Power } from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  salon_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface ActiveQueueEntry {
  id: string;
  status: string;
  position: number;
  staff_id: string | null;
  bookings: {
    notes: string | null;
    customer_id: string | null;
    customers: {
      first_name: string | null;
      last_name: string | null;
    } | null;
    salon_services?: {
      services?: {
        name: string;
      } | null;
    } | null;
    service_name?: string;
  } | null;
}

const PRESET_AVATARS = [
  { name: "Alex", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex" },
  { name: "Jordan", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan" },
  { name: "Taylor", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor" },
  { name: "Morgan", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan" },
  { name: "Harley", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Harley" },
  { name: "Casey", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Casey" }
];

export default function StaffManagement() {
  const { user, loading: authLoading } = useRequireAuth();
  const [salon, setSalon] = useState<any>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeQueue, setActiveQueue] = useState<ActiveQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaffData = useCallback(async (salonId: string) => {
    try {
      // 1. Fetch all staff members
      const { data: staffData, error: staffError } = await supabase
        .from("salon_staff")
        .select("*")
        .eq("salon_id", salonId)
        .order("created_at", { ascending: true });

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // 2. Fetch active queue entries to track operations
      const { data: queueData, error: queueError } = await supabase
        .from("queue_entries")
        .select(`
          id,
          status,
          position,
          staff_id,
          bookings (
            id,
            notes,
            customer_id,
            service_id,
            customers (
              first_name,
              last_name
            )
          )
        `)
        .eq("salon_id", salonId)
        .in("status", ["waiting", "called", "in_service"]);

      if (queueError) throw queueError;

      // Fetch service names for bookings
      const enrichedQueue: ActiveQueueEntry[] = [];
      if (queueData) {
        for (const entry of queueData) {
          let serviceName = "Service";
          const booking = entry.bookings as any;
          if (booking?.service_id) {
            const { data: sData } = await supabase
              .from("salon_services")
              .select("services(name)")
              .eq("id", booking.service_id)
              .maybeSingle();
            
            if (sData?.services) {
              serviceName = (sData.services as any).name;
            }
          }

          enrichedQueue.push({
            id: entry.id,
            status: entry.status || "waiting",
            position: entry.position,
            staff_id: entry.staff_id,
            bookings: booking ? {
              notes: booking.notes,
              customer_id: booking.customer_id,
              customers: booking.customers,
              service_name: serviceName
            } : null
          });
        }
      }

      setActiveQueue(enrichedQueue);
    } catch (error) {
      console.error("Error fetching staff/queue data:", error);
      toast.error("Failed to load staff details");
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchSalonAndData = async () => {
      setLoading(true);
      try {
        const { data: salonData, error: salonError } = await supabase
          .from("salons")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (salonError) throw salonError;
        setSalon(salonData);

        if (salonData) {
          await fetchStaffData(salonData.id);
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonAndData();
  }, [user, authLoading, fetchStaffData]);

  // Real-time listener for changes in staff or queue entries
  useEffect(() => {
    if (!salon?.id) return;

    const channel = supabase
      .channel(`salon-staff-updates-${salon.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "salon_staff", filter: `salon_id=eq.${salon.id}` },
        () => fetchStaffData(salon.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: `salon_id=eq.${salon.id}` },
        () => fetchStaffData(salon.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salon?.id, fetchStaffData]);

  const handleAddStaff = async () => {
    if (!name.trim()) {
      toast.error("Please enter stylist name");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("salon_staff").insert({
        salon_id: salon.id,
        name: name.trim(),
        avatar_url: avatarUrl,
        is_active: isActive
      });

      if (error) throw error;

      toast.success("Stylist added successfully");
      setIsAddOpen(false);
      setName("");
      setAvatarUrl(PRESET_AVATARS[0].url);
      setIsActive(true);
      await fetchStaffData(salon.id);
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add stylist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("salon_staff")
        .update({
          name: name.trim(),
          avatar_url: avatarUrl,
          is_active: isActive
        })
        .eq("id", selectedStaff.id);

      if (error) throw error;

      toast.success("Stylist updated successfully");
      setIsEditOpen(false);
      await fetchStaffData(salon.id);
    } catch (error) {
      console.error("Error editing staff:", error);
      toast.error("Failed to update stylist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("salon_staff")
        .delete()
        .eq("id", selectedStaff.id);

      if (error) throw error;

      toast.success("Stylist removed successfully");
      setIsDeleteOpen(false);
      await fetchStaffData(salon.id);
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to remove stylist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffMember: StaffMember, newActive: boolean) => {
    try {
      const { error } = await supabase
        .from("salon_staff")
        .update({ is_active: newActive })
        .eq("id", staffMember.id);

      if (error) throw error;
      toast.success(`${staffMember.name} is now ${newActive ? "active" : "inactive"}`);
      await fetchStaffData(salon.id);
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast.error("Failed to toggle status");
    }
  };

  const getCustomerName = (booking: any) => {
    if (!booking) return "Customer";
    if (booking.customers) {
      return `${booking.customers.first_name || ""} ${booking.customers.last_name || ""}`.trim() || "Customer";
    }
    // Parse walkin notes
    if (booking.notes && booking.notes.startsWith("Walk-in:")) {
      return booking.notes.split("Walk-in:")[1].split("-")[0].trim();
    }
    return "Customer";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SalonLoader size="lg" text="Loading staff panel..." />
      </div>
    );
  }

  return (
    <SalonDashboardLayout
      title="Stylists"
      description="Manage your team and track their active queue operations"
    >
      <div className="p-4 space-y-6 pb-24">
        {/* Header Summary */}
        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Stylists</p>
              <p className="text-lg font-bold text-foreground">
                {staff.length} {staff.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setName("");
              setAvatarUrl(PRESET_AVATARS[0].url);
              setIsActive(true);
              setIsAddOpen(true);
            }} 
            size="sm"
            className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Stylist
          </Button>
        </div>

        {/* Stylists List */}
        {staff.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-2xl">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">No Stylists Onboarded</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Onboard your styling team to allow customers to choose their preferred stylists.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {staff.map((member) => {
              // Calculate live operations for this member
              const memberQueue = activeQueue.filter((q) => q.staff_id === member.id);
              const inServiceEntry = memberQueue.find((q) => q.status === "in_service");
              const waitingQueue = memberQueue.filter((q) => q.status !== "in_service");

              return (
                <Card 
                  key={member.id} 
                  className={`border-2 transition-all ${
                    member.is_active 
                      ? "border-border hover:border-muted-foreground/20" 
                      : "border-border/60 opacity-75"
                  }`}
                >
                  <CardContent className="p-4 space-y-4">
                    {/* Top Row: Info and Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary/10">
                          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                          <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-foreground">
                              {member.name}
                            </h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              member.is_active 
                                ? "text-green-600 bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900" 
                                : "text-muted-foreground bg-muted border-border"
                            }`}>
                              {member.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {memberQueue.length > 0 
                              ? `${memberQueue.length} active in queue` 
                              : "No active queue"}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={(val) => handleToggleStatus(member, val)}
                          className="mr-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedStaff(member);
                            setName(member.name);
                            setAvatarUrl(member.avatar_url || PRESET_AVATARS[0].url);
                            setIsActive(member.is_active);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedStaff(member);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Row: Live Queue Operations Tracker */}
                    {member.is_active && (
                      <div className="pt-3 border-t border-border space-y-2">
                        {/* Currently Serving */}
                        {inServiceEntry ? (
                          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900">
                            <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                              Serving Now
                            </span>
                            <span className="font-bold text-foreground max-w-[180px] truncate">
                              {getCustomerName(inServiceEntry.bookings)} ({inServiceEntry.bookings?.service_name})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/30 border border-border">
                            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                              <Power className="h-3.5 w-3.5" />
                              Status
                            </span>
                            <span className="font-semibold text-muted-foreground">
                              Idle (No active service)
                            </span>
                          </div>
                        )}

                        {/* Waiting List in Queue */}
                        {waitingQueue.length > 0 ? (
                          <div className="flex items-start gap-2 p-2 rounded-lg border border-border bg-muted/20 text-xs">
                            <span className="text-muted-foreground font-semibold mt-0.5 shrink-0">
                              Waiting:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {waitingQueue.map((entry, idx) => (
                                <span 
                                  key={entry.id}
                                  className="font-medium bg-background border border-border px-2 py-0.5 rounded text-foreground inline-flex items-center gap-1"
                                >
                                  <span className="text-[9px] text-muted-foreground">#{idx + 1}</span>
                                  {getCustomerName(entry.bookings)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          memberQueue.length > 0 && !inServiceEntry && (
                            <p className="text-[11px] text-muted-foreground text-center italic">
                              Queue calculations processing...
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Stylist Dialog */}
        <Dialog 
          open={isAddOpen || isEditOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setIsAddOpen(false);
              setIsEditOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {isAddOpen ? "Add New Stylist" : "Edit Stylist Details"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAddOpen 
                  ? "Onboard a new stylist to your salon and select their profile avatar." 
                  : "Update the stylist profile, avatar, and active availability."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Name input */}
              <div className="space-y-1.5">
                <Label htmlFor="staff-name" className="text-sm font-semibold">Name</Label>
                <Input
                  id="staff-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="rounded-xl"
                  maxLength={40}
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Choose Avatar</Label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((av) => {
                    const isSelected = avatarUrl === av.url;
                    return (
                      <button
                        key={av.name}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        className={`relative rounded-full border-2 transition-all p-0.5 focus:outline-none ${
                          isSelected 
                            ? "border-primary scale-110 ring-2 ring-primary/20" 
                            : "border-transparent hover:border-border hover:scale-105"
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={av.url} alt={av.name} />
                          <AvatarFallback className="bg-muted text-[10px]">
                            {av.name}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 w-4 h-4 flex items-center justify-center border border-background">
                            <Check className="h-2.5 w-2.5 stroke-[4px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold text-foreground">Active Booking Availability</p>
                  <p className="text-xs text-muted-foreground">Allow customers to choose this stylist when booking</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={isAddOpen ? handleAddStaff : handleEditStaff}
                disabled={isSubmitting}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Saving..." : "Save Stylist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Delete Stylist
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Are you sure you want to remove <strong>{selectedStaff?.name}</strong> from your team? 
                This action cannot be undone and will unassign them from any active bookings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteStaff}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SalonDashboardLayout>
  );
}
