import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, Search, Phone, MessageCircle, Play, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Analytics {
  totalInQueue: number;
  waiting: number;
  inProgress: number;
  onlineBookings: number;
}

const QueueManagement = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalInQueue: 0,
    waiting: 0,
    inProgress: 0,
    onlineBookings: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
          .single();

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

          // Calculate analytics
          const totalInQueue = queueData.length;
          const waiting = queueData.filter(entry => entry.status === 'waiting').length;
          const inProgress = queueData.filter(entry => entry.status === 'in_progress').length;
          
          // Get today's bookings count for online bookings metric
          const today = new Date().toISOString().split('T')[0];
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('id')
            .eq('salon_id', salon.id)
            .gte('booking_date', today)
            .lt('booking_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

          setAnalytics({
            totalInQueue,
            waiting,
            inProgress,
            onlineBookings: bookingsData?.length || 0,
          });
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

  const filteredQueue = queue.filter(entry => {
    const matchesSearch = searchQuery === "" || 
      `${entry.profiles?.first_name || ''} ${entry.profiles?.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Queue Management</h1>
          <p className="text-white/90 mb-4">Monitor and manage your customer queue</p>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-white" />
                <p className="text-2xl font-bold text-white">{analytics.totalInQueue}</p>
                <p className="text-xs text-white/80">Total in Queue</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-white" />
                <p className="text-2xl font-bold text-white">{analytics.waiting}</p>
                <p className="text-xs text-white/80">Waiting</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Additional Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Play className="h-5 w-5 text-success" />
              </div>
              <p className="text-xl font-bold text-success">{analytics.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xl font-bold text-primary">{analytics.onlineBookings}</p>
              <p className="text-sm text-muted-foreground">Online Bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue List */}
        <div className="space-y-3">
          {filteredQueue.length > 0 ? (
            filteredQueue.map((entry) => (
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
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {entry.status === 'in_progress' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleCompleteService(entry.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
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
                <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'The queue is empty. New customers will appear here when they join.'}
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