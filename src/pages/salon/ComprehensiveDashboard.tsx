import React from "react";
import { User, Users, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";

const ComprehensiveDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();
  
  const {
    loading,
    salon,
    queue,
  } = useSalonRealtimeData();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon dashboard...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Salon Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to register your salon first to access the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      toast.success('Service started');
    } catch (error) {
      toast.error('Failed to start service');
    }
  };

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
      toast.success('Service completed');
    } catch (error) {
      toast.error('Failed to complete service');
    }
  };

  return (
    <SalonDashboardLayout
      title="Queue Management"
      description="Real-time customer queue"
    >
      <div className="p-4 space-y-4">
        <div className="space-y-3" data-tour="queue-section">
          {queue.length > 0 ? (
            queue.map((entry) => (
              <Card key={entry.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={entry.customers?.avatar_url ?? undefined}
                          alt="Customer avatar"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <AvatarFallback className="bg-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{entry.position}
                          </Badge>
                          <h3 className="font-semibold">
                            {entry.customers?.first_name || 'Unknown'} {entry.customers?.last_name || 'Customer'}
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
                          Phone: {entry.customers?.phone || 'N/A'} • Joined: {new Date(entry.check_in_time).toLocaleTimeString()}
                        </p>
                      </div>
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
    </SalonDashboardLayout>
  );
};

export default ComprehensiveDashboard;