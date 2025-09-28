import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationControlsProps {
  salonId: string;
  className?: string;
}

const NotificationControls: React.FC<NotificationControlsProps> = ({ salonId, className = '' }) => {
  const [customMessage, setCustomMessage] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendCustomNotification = async () => {
    if (!customMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      // Get all waiting customers for this salon
      const { data: queueEntries, error: queueError } = await supabase
        .from('queue_entries')
        .select('customer_id, id')
        .eq('salon_id', salonId)
        .eq('status', 'waiting');

      if (queueError) throw queueError;

      if (!queueEntries || queueEntries.length === 0) {
        toast.info('No customers currently waiting');
        return;
      }

      // Send notifications to all waiting customers
      const notifications = queueEntries.map(entry => ({
        user_id: entry.customer_id,
        title: customTitle || 'Message from Salon',
        message: customMessage,
        type: 'general' as const,
        related_id: entry.id
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;

      toast.success(`Notification sent to ${queueEntries.length} waiting customers`);
      setCustomMessage('');
      setCustomTitle('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickNotification = async (message: string, title: string) => {
    setIsLoading(true);
    try {
      // Get all waiting customers for this salon
      const { data: queueEntries, error: queueError } = await supabase
        .from('queue_entries')
        .select('customer_id, id')
        .eq('salon_id', salonId)
        .eq('status', 'waiting');

      if (queueError) throw queueError;

      if (!queueEntries || queueEntries.length === 0) {
        toast.info('No customers currently waiting');
        return;
      }

      // Send notifications to all waiting customers
      const notifications = queueEntries.map(entry => ({
        user_id: entry.customer_id,
        title: title,
        message: message,
        type: 'general' as const,
        related_id: entry.id
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;

      toast.success(`"${title}" sent to ${queueEntries.length} waiting customers`);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Customer Notifications</h3>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Quick Messages</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickNotification(
                'We are running about 10 minutes behind schedule. Thank you for your patience!',
                'Running Slightly Late'
              )}
              disabled={isLoading}
              className="justify-start h-auto p-3"
            >
              <Clock className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Running Late</div>
                <div className="text-xs text-muted-foreground">10 min delay</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickNotification(
                'Great news! We are ahead of schedule and your service will begin sooner than expected.',
                'Ahead of Schedule'
              )}
              disabled={isLoading}
              className="justify-start h-auto p-3"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Ahead of Schedule</div>
                <div className="text-xs text-muted-foreground">Early service</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Custom Message</h4>
          
          <div className="space-y-2">
            <Label htmlFor="notification-title">Title (Optional)</Label>
            <Input
              id="notification-title"
              placeholder="Message from Salon"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              placeholder="Enter your message to all waiting customers..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <Button
            onClick={sendCustomNotification}
            disabled={isLoading || !customMessage.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send to All Waiting Customers'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          Messages will be sent to all customers currently waiting in the queue.
        </div>
      </div>
    </Card>
  );
};

export default NotificationControls;