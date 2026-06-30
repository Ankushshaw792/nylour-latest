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
import { Plus, Edit2, Trash2, Users, AlertCircle, Sparkles, Clock, Check, Power, GripVertical, Play, UserX, Upload } from "lucide-react";
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
  check_in_time: string;
  bookings: {
    id: string;
    notes: string | null;
    customer_id: string | null;
    customers: {
      first_name: string | null;
      last_name: string | null;
    } | null;
    service_name?: string;
    queue_check_in_time?: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
          check_in_time,
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
            check_in_time: entry.check_in_time,
            bookings: booking ? {
              id: booking.id,
              notes: booking.notes,
              customer_id: booking.customer_id,
              customers: booking.customers,
              service_name: serviceName,
              queue_check_in_time: entry.check_in_time
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

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!salon?.id) throw new Error("No salon ID");
    const fileExt = file.name.split('.').pop();
    const fileName = `staff_${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${salon.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('salon-images')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('salon-images')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleAddStaff = async () => {
    if (!name.trim()) {
      toast.error("Please enter stylist name");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (selectedFile) {
        finalAvatarUrl = await uploadAvatar(selectedFile);
      }

      const { error } = await supabase.from("salon_staff").insert({
        salon_id: salon.id,
        name: name.trim(),
        avatar_url: finalAvatarUrl,
        is_active: isActive
      });

      if (error) throw error;

      toast.success("Stylist added successfully");
      setIsAddOpen(false);
      setName("");
      setAvatarUrl(PRESET_AVATARS[0].url);
      setSelectedFile(null);
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
      let finalAvatarUrl = avatarUrl;
      if (selectedFile) {
        finalAvatarUrl = await uploadAvatar(selectedFile);
      }

      const { error } = await supabase
        .from("salon_staff")
        .update({
          name: name.trim(),
          avatar_url: finalAvatarUrl,
          is_active: isActive
        })
        .eq("id", selectedStaff.id);

      if (error) throw error;

      toast.success("Stylist updated successfully");
      setIsEditOpen(false);
      setSelectedFile(null);
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

  // Drag and drop states for queue reordering
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [draggedOverBookingId, setDraggedOverBookingId] = useState<string | null>(null);

  // Drag and drop handlers
  const handleDragStart = (bookingId: string) => {
    setDraggedBookingId(bookingId);
  };

  const handleDragOver = (e: React.DragEvent, bookingId: string) => {
    e.preventDefault();
    if (draggedBookingId !== bookingId) {
      setDraggedOverBookingId(bookingId);
    }
  };

  const handleDragEnd = () => {
    setDraggedBookingId(null);
    setDraggedOverBookingId(null);
  };

  const handleDrop = async (targetBookingId: string, memberQueue: any[]) => {
    if (!draggedBookingId || draggedBookingId === targetBookingId) return;
    
    const waitingBookings = memberQueue.filter(q => q.status === 'waiting' || q.status === 'called');
    const targetIdx = waitingBookings.findIndex(q => q.bookings?.id === targetBookingId);
    if (targetIdx === -1) return;
    
    await handleReorderQueue(draggedBookingId, targetIdx, memberQueue);
    handleDragEnd();
  };

  // Reorder queue at stylist level
  const handleReorderQueue = async (bookingId: string, targetIdx: number, memberQueue: any[]) => {
    const waitingBookings = memberQueue.filter(q => q.status === 'waiting' || q.status === 'called');
    
    if (waitingBookings.length <= 1) return;
    
    const currentIdx = waitingBookings.findIndex(q => q.bookings?.id === bookingId);
    if (currentIdx === -1 || currentIdx === targetIdx) return;
    
    // Rearrange the list temporarily to determine new neighbors
    const updatedList = [...waitingBookings];
    const [draggedItem] = updatedList.splice(currentIdx, 1);
    updatedList.splice(targetIdx, 0, draggedItem);
    
    let newTime: Date;
    if (targetIdx === 0) {
      // Moved to the very top
      const baseTime = updatedList[1]?.bookings?.queue_check_in_time 
        ? new Date(updatedList[1].bookings.queue_check_in_time) 
        : new Date();
      baseTime.setSeconds(baseTime.getSeconds() - 1);
      newTime = baseTime;
    } else if (targetIdx === updatedList.length - 1) {
      // Moved to the very bottom
      const baseTime = updatedList[updatedList.length - 2]?.bookings?.queue_check_in_time 
        ? new Date(updatedList[updatedList.length - 2].bookings.queue_check_in_time) 
        : new Date();
      baseTime.setSeconds(baseTime.getSeconds() + 1);
      newTime = baseTime;
    } else {
      // Moved in between two entries
      const prevTimeStr = updatedList[targetIdx - 1]?.bookings?.queue_check_in_time;
      const nextTimeStr = updatedList[targetIdx + 1]?.bookings?.queue_check_in_time;
      const prevTime = prevTimeStr ? new Date(prevTimeStr).getTime() : new Date().getTime();
      const nextTime = nextTimeStr ? new Date(nextTimeStr).getTime() : new Date().getTime();
      newTime = new Date(prevTime + (nextTime - prevTime) / 2);
    }
    
    try {
      // Direct table update to trigger positions recalculation
      const { data: qeData } = await supabase
        .from('queue_entries')
        .select('id, status')
        .eq('booking_id', bookingId)
        .maybeSingle();
        
      if (qeData) {
        const { error } = await supabase
          .from('queue_entries')
          .update({
            check_in_time: newTime.toISOString(),
            status: qeData.status
          })
          .eq('id', qeData.id);
          
        if (error) throw error;
        toast.success("Position updated smoothly");
        await fetchStaffData(salon.id);
      }
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to update position");
    }
  };

  // Start service
  const handleStartService = async (bookingId: string) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId);
        
      if (bookingError) throw bookingError;
      
      const { error: queueError } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'in_service',
          service_start_time: new Date().toISOString()
        })
        .eq('booking_id', bookingId);
        
      if (queueError) throw queueError;
      toast.success("Service started");
      await fetchStaffData(salon.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start service");
    }
  };

  // Complete service
  const handleCompleteService = async (bookingId: string) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
        
      if (bookingError) throw bookingError;
      
      const { error: queueError } = await supabase
        .from('queue_entries')
        .update({ status: 'completed' })
        .eq('booking_id', bookingId);
        
      if (queueError) throw queueError;
      toast.success("Service completed");
      await fetchStaffData(salon.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete service");
    }
  };

  // Mark No-Show
  const handleMarkNoShow = async (bookingId: string) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          notes: 'Marked as no-show'
        })
        .eq('id', bookingId);
        
      if (bookingError) throw bookingError;
      
      const { error: queueError } = await supabase
        .from('queue_entries')
        .update({ status: 'completed' })
        .eq('booking_id', bookingId);
        
      if (queueError) throw queueError;
      toast.success("Customer marked as no-show");
      await fetchStaffData(salon.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark no-show");
    }
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
              setSelectedFile(null);
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
                            setSelectedFile(null);
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

                    {/* Bottom Row: Stylist Queue Control Panel */}
                    {member.is_active && (
                      <div className="pt-4 border-t border-border space-y-4">
                        {/* Currently Serving Section */}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Currently Serving</p>
                          {inServiceEntry ? (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-900 shadow-sm">
                              <div className="flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
                                <div>
                                  <p className="text-sm font-bold text-foreground">
                                    {getCustomerName(inServiceEntry.bookings)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {inServiceEntry.bookings?.service_name || "Service"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 hover:bg-green-100 dark:hover:bg-green-950/30 text-green-600 font-semibold rounded-lg text-xs flex items-center gap-1"
                                onClick={() => handleCompleteService(inServiceEntry.bookings?.id || "")}
                              >
                                <Check className="h-3 w-3" /> Complete
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-4 rounded-xl bg-muted/20 border border-dashed border-border/60">
                              <p className="text-xs text-muted-foreground italic">Idle • No active service</p>
                            </div>
                          )}
                        </div>

                        {/* Waiting List Queue Control Section */}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Waiting Queue ({waitingQueue.length})</span>
                            {waitingQueue.length > 0 && <span className="text-[10px] lowercase text-muted-foreground font-normal">drag or use wheel to reorder</span>}
                          </p>
                          
                          {waitingQueue.length === 0 ? (
                            <div className="text-center py-6 bg-muted/10 rounded-xl border border-border/40">
                              <p className="text-xs text-muted-foreground italic">Queue is empty</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {(() => {
                                // Sort waiting queue strictly by position to render correctly
                                const sortedWaiting = [...waitingQueue].sort((a, b) => a.position - b.position);
                                
                                return sortedWaiting.map((entry, idx) => {
                                  const bookingId = entry.bookings?.id || "";
                                  const isCurrentDragged = draggedBookingId === bookingId;
                                  const isCurrentDraggedOver = draggedOverBookingId === bookingId;
                                  
                                  return (
                                    <div
                                      key={entry.id}
                                      className={`p-3 rounded-xl border-2 transition-all bg-background/50 flex flex-col gap-3 ${
                                        isCurrentDragged ? 'opacity-40 select-none' : ''
                                      } ${
                                        isCurrentDraggedOver ? 'ring-2 ring-primary ring-dashed bg-primary/5' : 'border-border/60'
                                      }`}
                                      draggable={true}
                                      onDragStart={() => handleDragStart(bookingId)}
                                      onDragOver={(e) => handleDragOver(e, bookingId)}
                                      onDragEnd={handleDragEnd}
                                      onDrop={() => handleDrop(bookingId, sortedWaiting)}
                                    >
                                      {/* Row 1: Details, Drag Handle, Action Buttons */}
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div 
                                            className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground p-0.5"
                                            title="Drag to reorder"
                                          >
                                            <GripVertical className="h-4 w-4" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">
                                              #{idx + 1} {getCustomerName(entry.bookings)}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                              {entry.bookings?.service_name || "Service"}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                                            title="Mark as no-show"
                                            onClick={() => handleMarkNoShow(bookingId)}
                                          >
                                            <UserX className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-7 px-2.5 text-xs font-semibold rounded-lg flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                                            onClick={() => handleStartService(bookingId)}
                                            disabled={!!inServiceEntry}
                                            title={inServiceEntry ? "Please complete current service first" : "Start Service"}
                                          >
                                            <Play className="h-3 w-3 fill-current" /> Start
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Row 2: Tactile Smooth Position Drag Wheel */}
                                      <div className="pt-2 border-t border-border/30 flex items-center gap-2">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase shrink-0">Position Wheel:</span>
                                        <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scroll-smooth">
                                          {sortedWaiting.map((_, pIdx) => {
                                            const isSelected = pIdx === idx;
                                            return (
                                              <button
                                                key={pIdx}
                                                type="button"
                                                onClick={() => handleReorderQueue(bookingId, pIdx, sortedWaiting)}
                                                className={`h-6 min-w-[24px] px-1.5 rounded-md text-[11px] font-bold transition-all shrink-0 border ${
                                                  isSelected
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-110"
                                                    : "bg-background border-border/80 text-muted-foreground hover:border-primary/45 hover:text-foreground"
                                                }`}
                                              >
                                                {pIdx + 1}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
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

              {/* Custom Image Upload */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-avatar" className="text-sm font-semibold">Or Upload Custom Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="rounded-xl file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Recommended: Square image, max 5MB</p>
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
