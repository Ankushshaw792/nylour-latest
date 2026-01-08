import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Send, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const QUICK_NOTIFICATIONS = [
  { title: "Running Late", message: "We're experiencing some delays. Thank you for your patience!" },
  { title: "Ahead of Schedule", message: "Good news! We're moving faster than expected. Please be ready!" },
  { title: "Your Turn Soon", message: "You're next in line! Please make your way to the salon." },
  { title: "Break Time", message: "We're taking a short break. We'll resume shortly." },
];

const CustomerNotificationPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    const fetchSalonId = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (salonData) {
          setSalonId(salonData.id);
        }
      } catch (error) {
        console.error('Error fetching salon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonId();
  }, [user]);

  const sendNotification = async (title: string, message: string) => {
    if (!salonId) return;
    setSending(true);

    try {
      // Get all waiting customers
      const { data: queueEntries } = await supabase
        .from('queue_entries')
        .select('customer_id, customers!inner(user_id)')
        .eq('salon_id', salonId)
        .eq('status', 'waiting');

      if (!queueEntries || queueEntries.length === 0) {
        toast({
          title: "No customers",
          description: "There are no customers waiting in queue.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Send notifications
      const notifications = queueEntries.map((entry: any) => ({
        user_id: entry.customers.user_id,
        title,
        message,
        type: 'announcement',
      }));

      const { error } = await supabase.from('notifications').insert(notifications);

      if (error) throw error;

      toast({
        title: "Notification sent",
        description: `Sent to ${queueEntries.length} waiting customer(s).`,
      });

      setCustomTitle("");
      setCustomMessage("");
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendCustom = () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both title and message.",
        variant: "destructive",
      });
      return;
    }
    sendNotification(customTitle, customMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <h1 className="text-lg font-semibold text-foreground">Customer Notification</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Quick Notifications */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5" />
              Quick Notifications
            </CardTitle>
            <CardDescription>
              Send pre-defined messages to waiting customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_NOTIFICATIONS.map((notif, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full h-auto py-3 px-4 flex flex-col items-start text-left justify-start gap-1 whitespace-normal"
                onClick={() => sendNotification(notif.title, notif.message)}
                disabled={sending}
              >
                <span className="font-semibold text-sm">{notif.title}</span>
                <span className="text-xs text-muted-foreground leading-relaxed break-words">
                  {notif.message}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Custom Notification */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Custom Notification
            </CardTitle>
            <CardDescription>
              Send a custom message to all waiting customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter notification title"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message"
                className="mt-1.5"
                rows={3}
              />
            </div>
            <Button onClick={handleSendCustom} disabled={sending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerNotificationPage;
