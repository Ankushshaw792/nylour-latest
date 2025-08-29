import { useState } from "react";
import { Clock, Users, Plus, Minus, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";

const CheckInUpdate = () => {
  const [currentWaitTime, setCurrentWaitTime] = useState(25);
  const [newWaitTime, setNewWaitTime] = useState(25);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const { toast } = useToast();

  const handleUpdateWaitTime = () => {
    setCurrentWaitTime(newWaitTime);
    toast({
      title: "Wait time updated",
      description: `New wait time set to ${newWaitTime} minutes`,
    });
  };

  const handleWalkInCheckIn = () => {
    if (!walkInName || !walkInPhone) {
      toast({
        title: "Missing information",
        description: "Please enter customer name and phone number",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Walk-in customer added",
      description: `${walkInName} has been added to the queue`,
    });
    
    setWalkInName("");
    setWalkInPhone("");
  };

  return (
    <SalonDashboardLayout
      title="Check-in & Updates"
      description="Manage walk-ins and wait times"
    >
      <div className="p-4 space-y-6">
        {/* Current Wait Time Display */}
        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Current Wait Time</h3>
              <p className="text-3xl font-bold text-primary">{currentWaitTime} min</p>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: Just now
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Update Wait Time */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Update Wait Time</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="waitTime">New wait time (minutes)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="outline"
                    size="mobile-icon"
                    onClick={() => setNewWaitTime(Math.max(0, newWaitTime - 5))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    id="waitTime"
                    type="number"
                    value={newWaitTime}
                    onChange={(e) => setNewWaitTime(Number(e.target.value))}
                    className="text-center text-lg font-semibold"
                    min="0"
                  />
                  
                  <Button
                    variant="outline"
                    size="mobile-icon"
                    onClick={() => setNewWaitTime(newWaitTime + 5)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="gradient"
                size="xl"
                className="w-full"
                onClick={handleUpdateWaitTime}
              >
                <Save className="h-5 w-5 mr-2" />
                Update Wait Time
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Walk-in Customer Check-in */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="font-semibold">Walk-in Customer Check-in</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button
                variant="secondary"
                size="xl"
                className="w-full"
                onClick={handleWalkInCheckIn}
              >
                <Users className="h-5 w-5 mr-2" />
                Add to Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => setNewWaitTime(0)}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs">No Wait</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => setNewWaitTime(15)}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs">15 Min</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => setNewWaitTime(30)}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs">30 Min</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => setNewWaitTime(60)}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs">1 Hour</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SalonDashboardLayout>
  );
};

export default CheckInUpdate;