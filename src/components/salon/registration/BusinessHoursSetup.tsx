import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalonFormData } from "../SalonRegistrationForm";

interface BusinessHoursSetupProps {
  formData: SalonFormData;
  updateFormData: (updates: Partial<SalonFormData>) => void;
}

const daysOfWeek = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export const BusinessHoursSetup = ({ formData, updateFormData }: BusinessHoursSetupProps) => {
  const updateHour = (dayOfWeek: number, field: string, value: string | boolean) => {
    const updatedHours = formData.businessHours.map(hour => 
      hour.day_of_week === dayOfWeek 
        ? { ...hour, [field]: value }
        : hour
    );
    updateFormData({ businessHours: updatedHours });
  };

  const getHoursForDay = (dayOfWeek: number) => {
    return formData.businessHours.find(hour => hour.day_of_week === dayOfWeek);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Set Your Operating Hours</h3>
        <p className="text-muted-foreground">
          Configure when your salon is open for bookings
        </p>
      </div>

      <div className="grid gap-4">
        {daysOfWeek.map((day) => {
          const hours = getHoursForDay(day.id);
          if (!hours) return null;

          return (
            <Card key={day.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {day.name}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`closed-${day.id}`} className="text-sm">
                      {hours.is_closed ? 'Closed' : 'Open'}
                    </Label>
                    <Switch
                      id={`closed-${day.id}`}
                      checked={!hours.is_closed}
                      onCheckedChange={(checked) => 
                        updateHour(day.id, 'is_closed', !checked)
                      }
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              
              {!hours.is_closed && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`open-${day.id}`} className="text-sm">
                        Opening Time
                      </Label>
                      <Input
                        id={`open-${day.id}`}
                        type="time"
                        value={hours.open_time}
                        onChange={(e) => 
                          updateHour(day.id, 'open_time', e.target.value)
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`close-${day.id}`} className="text-sm">
                        Closing Time
                      </Label>
                      <Input
                        id={`close-${day.id}`}
                        type="time"
                        value={hours.close_time}
                        onChange={(e) => 
                          updateHour(day.id, 'close_time', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Toggle the switch to mark days as closed</li>
          <li>• Set realistic hours that you can consistently maintain</li>
          <li>• You can always update these hours later from your dashboard</li>
          <li>• Customers will only see available booking slots during open hours</li>
        </ul>
      </div>
    </div>
  );
};