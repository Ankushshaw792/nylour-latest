import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalonFormData } from "../SalonRegistrationForm";
import { Users, Clock, Calendar } from "lucide-react";

interface BusinessSettingsProps {
  formData: SalonFormData;
  updateFormData: (updates: Partial<SalonFormData>) => void;
}

export const BusinessSettings = ({ formData, updateFormData }: BusinessSettingsProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Business Settings</h3>
        <p className="text-muted-foreground">
          Configure your salon's operational preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Queue Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxQueueSize">Maximum Queue Size</Label>
              <Input
                id="maxQueueSize"
                type="number"
                min="1"
                max="100"
                value={formData.maxQueueSize}
                onChange={(e) => 
                  updateFormData({ maxQueueSize: parseInt(e.target.value) || 20 })
                }
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of customers that can wait in queue
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Wait Time Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentWaitTime">Average Wait Time (minutes)</Label>
              <Input
                id="currentWaitTime"
                type="number"
                min="5"
                max="240"
                value={formData.currentWaitTime}
                onChange={(e) => 
                  updateFormData({ currentWaitTime: parseInt(e.target.value) || 30 })
                }
              />
              <p className="text-sm text-muted-foreground">
                Typical time customers wait between services
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Booking Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Accept Online Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to book appointments online
                </p>
              </div>
              <Switch
                checked={formData.acceptsBookings}
                onCheckedChange={(checked) => 
                  updateFormData({ acceptsBookings: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Settings Overview:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Queue size helps manage customer expectations</li>
          <li>• Wait time is used to estimate customer arrival times</li>
          <li>• You can toggle online bookings on/off anytime</li>
          <li>• These settings can be adjusted from your dashboard later</li>
        </ul>
      </div>
    </div>
  );
};