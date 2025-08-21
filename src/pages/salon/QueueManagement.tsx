import { useState } from "react";
import { Clock, User, CheckCircle2, Phone, MoreVertical, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for queue
const initialQueue = [
  {
    id: 1,
    name: "Rahul Kumar",
    phone: "+91 98765 43210",
    service: "Haircut",
    type: "online",
    waitTime: "5 min",
    position: 1,
    status: "current"
  },
  {
    id: 2,
    name: "Priya Singh",
    phone: "+91 98765 43211",
    service: "Beard Trim",
    type: "online",
    waitTime: "15 min",
    position: 2,
    status: "waiting"
  },
  {
    id: 3,
    name: "Walk-in Customer",
    phone: "+91 98765 43212",
    service: "Haircut",
    type: "walkin",
    waitTime: "25 min",
    position: 3,
    status: "waiting"
  }
];

const QueueManagement = () => {
  const [queue, setQueue] = useState(initialQueue);
  
  const handleCompleteService = (customerId: number) => {
    setQueue(prev => prev.filter(customer => customer.id !== customerId));
  };

  const handleMoveUp = (customerId: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const index = newQueue.findIndex(c => c.id === customerId);
      if (index > 0) {
        [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
        // Update positions
        newQueue.forEach((customer, i) => {
          customer.position = i + 1;
        });
      }
      return newQueue;
    });
  };

  const currentCustomer = queue.find(c => c.status === 'current');
  const waitingCustomers = queue.filter(c => c.status === 'waiting');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Style Studio</h1>
          <p className="text-white/90">Queue Management Dashboard</p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{queue.length}</p>
            <p className="text-xs text-white/80">Total in Queue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{waitingCustomers.length}</p>
            <p className="text-xs text-white/80">Waiting</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">25 min</p>
            <p className="text-xs text-white/80">Avg Wait</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Service</TabsTrigger>
            <TabsTrigger value="queue">Queue ({waitingCustomers.length})</TabsTrigger>
          </TabsList>

          {/* Current Customer */}
          <TabsContent value="current" className="space-y-4">
            {currentCustomer ? (
              <Card className="bg-gradient-card">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{currentCustomer.name}</h3>
                    <p className="text-muted-foreground">{currentCustomer.service}</p>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant={currentCustomer.type === 'online' ? 'default' : 'secondary'}>
                        {currentCustomer.type === 'online' ? 'Online' : 'Walk-in'}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{currentCustomer.phone}</p>
                    </div>
                  </div>

                  <Button
                    variant="success"
                    size="xl"
                    className="w-full"
                    onClick={() => handleCompleteService(currentCustomer.id)}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Mark as Complete
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Current Customer</h3>
                  <p className="text-muted-foreground">Queue is empty</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Queue List */}
          <TabsContent value="queue" className="space-y-4">
            {waitingCustomers.length > 0 ? (
              waitingCustomers.map((customer, index) => (
                <Card key={customer.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Position */}
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="font-bold text-primary">#{customer.position}</span>
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{customer.name}</h4>
                          <Badge variant={customer.type === 'online' ? 'default' : 'secondary'} className="text-xs">
                            {customer.type === 'online' ? 'Online' : 'Walk-in'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{customer.service}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>

                      {/* Wait Time */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{customer.waitTime}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="mobile-icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMoveUp(customer.id)}>
                            Move Up
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCompleteService(customer.id)}>
                            Remove from Queue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Customers Waiting</h3>
                  <p className="text-muted-foreground">All caught up!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QueueManagement;