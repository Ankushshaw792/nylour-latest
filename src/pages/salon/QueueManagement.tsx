import { useState, useEffect } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { Clock, Users, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface QueueEntry {
  id: string;
  customer_id: string;
  service_id: string;
  queue_number: number;
  estimated_wait_time: number | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  joined_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  services: {
    name: string;
  } | null;
}


const QueueManagement = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueueData = async () => {
      if (!user?.id) return;

      try {
        // Get salon ID first
        const { data: salon } = await supabase
          .from('salons')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!salon) return;

        // Fetch queue entries with related data
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select(`
            *,
            profiles:customer_id (
              first_name,
              last_name,
              phone
            ),
            services (
              name
            )
          `)
          .eq('salon_id', salon.id)
          .in('status', ['waiting', 'in_progress'])
          .order('joined_at');

        if (queueData) {
          setQueue(queueData as any);
        }
      } catch (error) {
        console.error('Error fetching queue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueueData();

    // Set up real-time subscription
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => fetchQueueData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCompleteService = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing service:', error);
    }
  };

  const handleStartService = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting service:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SalonLoader size="lg" text="Loading queue..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Queue Management</h1>
          <p className="text-white/90">Monitor and manage your customer queue</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Queue List */}
        <div className="space-y-3">
          {queue.length > 0 ? (
            queue.map((entry) => (
              <Card key={entry.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{entry.queue_number}
                        </Badge>
                        <h3 className="font-semibold">
                          {entry.profiles?.first_name || 'Unknown'} {entry.profiles?.last_name || 'Customer'}
                        </h3>
                        <Badge 
                          variant={entry.status === 'in_progress' ? 'default' : 'secondary'}
                          className={entry.status === 'in_progress' ? 'bg-success text-success-foreground' : ''}
                        >
                          {entry.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.services?.name || 'Service'}</p>
                      <p className="text-xs text-muted-foreground">
                        Phone: {entry.profiles?.phone || 'N/A'} • Joined: {new Date(entry.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        ~{entry.estimated_wait_time || 0} min
                      </p>
                      <p className="text-xs text-muted-foreground">Est. wait</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {entry.status === 'waiting' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleStartService(entry.id)}
                      >
                        Start Service
                      </Button>
                    )}
                    
                    {entry.status === 'in_progress' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleCompleteService(entry.id)}
                      >
                        Complete
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
                <p className="text-muted-foreground">
                  New customers will appear here when they join the queue.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueManagement;