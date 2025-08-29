import React, { useState } from "react";
import { User, Users, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ComprehensiveDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const navigate = useNavigate();
  
  const {
    loading,
    salon,
    queue,
    updateSalonStatus,
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

  const handleToggleOnline = async () => {
    try {
      await updateSalonStatus({ is_online: !salon.is_online });
      toast.success(salon.is_online ? 'Salon is now offline' : 'Salon is now online');
    } catch (error) {
      toast.error('Failed to update salon status');
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{salon.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="online-toggle" className="text-white text-sm">
                {salon.is_online ? "Online" : "Offline"}
              </Label>
              <Switch
                id="online-toggle"
                checked={salon.is_online}
                onCheckedChange={handleToggleOnline}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/salon-dashboard/profile')}
              className="text-white hover:bg-white/20"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Queue Section */}
      <div className="p-4 space-y-4">
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

export default ComprehensiveDashboard;