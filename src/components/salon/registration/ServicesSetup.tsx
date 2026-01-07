import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SalonFormData } from "../SalonRegistrationForm";
import { Loader2, IndianRupee, Clock, Plus, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  default_duration: number;
}

interface ServicesSetupProps {
  formData: SalonFormData;
  updateFormData: (updates: Partial<SalonFormData>) => void;
}

export const ServicesSetup = ({ formData, updateFormData }: ServicesSetupProps) => {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServiceDescription, setCustomServiceDescription] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState<number>(200);
  const [customServiceDuration, setCustomServiceDuration] = useState<number>(30);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const isServiceSelected = (serviceId: string) => {
    return formData.selectedServices.some(s => s.service_id === serviceId);
  };

  const getSelectedService = (serviceId: string) => {
    return formData.selectedServices.find(s => s.service_id === serviceId);
  };

  const toggleService = (service: Service) => {
    if (isServiceSelected(service.id)) {
      // Remove service
      const updated = formData.selectedServices.filter(s => s.service_id !== service.id);
      updateFormData({ selectedServices: updated });
    } else {
      // Add service with default values
      const updated = [...formData.selectedServices, {
        service_id: service.id,
        price: 50, // Default price
        duration: service.default_duration,
      }];
      updateFormData({ selectedServices: updated });
    }
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    const updated = formData.selectedServices.map(s => 
      s.service_id === serviceId ? { ...s, price } : s
    );
    updateFormData({ selectedServices: updated });
  };

  const updateServiceDuration = (serviceId: string, duration: number) => {
    const updated = formData.selectedServices.map(s => 
      s.service_id === serviceId ? { ...s, duration } : s
    );
    updateFormData({ selectedServices: updated });
  };

  const addCustomService = () => {
    if (!customServiceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    
    const customId = `custom-${Date.now()}`;
    const customServices = formData.customServices || [];
    const newCustomService = {
      id: customId,
      name: customServiceName.trim(),
      description: customServiceDescription.trim(),
      price: customServicePrice,
      duration: customServiceDuration,
    };
    
    updateFormData({ 
      customServices: [...customServices, newCustomService]
    });
    
    // Reset form
    setCustomServiceName("");
    setCustomServiceDescription("");
    setCustomServicePrice(200);
    setCustomServiceDuration(30);
    toast.success('Custom service added!');
  };

  const removeCustomService = (customId: string) => {
    const customServices = formData.customServices || [];
    updateFormData({
      customServices: customServices.filter(s => s.id !== customId)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Your Services</h3>
        <p className="text-muted-foreground">
          Choose the services you offer and set your pricing
        </p>
      </div>

      <div className="grid gap-4">
        {availableServices.map((service) => {
          const isSelected = isServiceSelected(service.id);
          const selectedService = getSelectedService(service.id);

          return (
            <Card key={service.id} className={isSelected ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleService(service)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isSelected && selectedService && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        Price (₹)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={selectedService.price}
                        onChange={(e) => 
                          updateServicePrice(service.id, parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration (minutes)
                      </Label>
                      <Input
                        type="number"
                        min="5"
                        step="5"
                        value={selectedService.duration}
                        onChange={(e) => 
                          updateServiceDuration(service.id, parseInt(e.target.value) || service.default_duration)
                        }
                        placeholder={service.default_duration.toString()}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Custom Services List */}
      {(formData.customServices || []).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Your Custom Services</h4>
          {formData.customServices?.map((custom) => (
            <Card key={custom.id} className="ring-2 ring-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{custom.name}</CardTitle>
                    {custom.description && (
                      <p className="text-sm text-muted-foreground mt-1">{custom.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomService(custom.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {custom.price}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {custom.duration} mins
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Custom Service Section */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Your Own Service
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Don't see a service you offer? Add it here.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Service Name *</Label>
            <Input
              value={customServiceName}
              onChange={(e) => setCustomServiceName(e.target.value)}
              placeholder="e.g., Hair Spa Treatment"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={customServiceDescription}
              onChange={(e) => setCustomServiceDescription(e.target.value)}
              placeholder="Brief description of the service"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center">
                <IndianRupee className="h-4 w-4 mr-1" />
                Price (₹)
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={customServicePrice}
                onChange={(e) => setCustomServicePrice(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Duration (minutes)
              </Label>
              <Input
                type="number"
                min="5"
                step="5"
                value={customServiceDuration}
                onChange={(e) => setCustomServiceDuration(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={addCustomService}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardContent>
      </Card>

      {formData.selectedServices.length === 0 && (formData.customServices || []).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please select or add at least one service to continue</p>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Pricing Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Research local market rates for competitive pricing</li>
          <li>• Consider your experience level and salon location</li>
          <li>• Duration affects scheduling - be realistic about timing</li>
          <li>• You can always adjust prices later from your dashboard</li>
        </ul>
      </div>
    </div>
  );
};