import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BasicSalonInfo } from "./registration/BasicSalonInfo";
import { BusinessHoursSetup } from "./registration/BusinessHoursSetup";
import { ServicesSetup } from "./registration/ServicesSetup";
import { BusinessSettings } from "./registration/BusinessSettings";
import { RegistrationSuccess } from "./registration/RegistrationSuccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface SalonFormData {
  // Basic Info
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  
  // Business Hours
  businessHours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
  
  // Services
  selectedServices: Array<{
    service_id: string;
    price: number;
    duration: number;
  }>;
  
  // Business Settings
  maxQueueSize: number;
  currentWaitTime: number;
  acceptsBookings: boolean;
  imageUrl?: string;
}

const initialFormData: SalonFormData = {
  name: "",
  description: "",
  email: "",
  phone: "",
  address: "",
  businessHours: [
    { day_of_week: 1, open_time: "09:00", close_time: "18:00", is_closed: false },
    { day_of_week: 2, open_time: "09:00", close_time: "18:00", is_closed: false },
    { day_of_week: 3, open_time: "09:00", close_time: "18:00", is_closed: false },
    { day_of_week: 4, open_time: "09:00", close_time: "18:00", is_closed: false },
    { day_of_week: 5, open_time: "09:00", close_time: "18:00", is_closed: false },
    { day_of_week: 6, open_time: "10:00", close_time: "16:00", is_closed: false },
    { day_of_week: 0, open_time: "10:00", close_time: "16:00", is_closed: true },
  ],
  selectedServices: [],
  maxQueueSize: 20,
  currentWaitTime: 30,
  acceptsBookings: true,
};

const steps = [
  { title: "Basic Information", description: "Tell us about your salon" },
  { title: "Business Hours", description: "Set your operating hours" },
  { title: "Services & Pricing", description: "Configure your services" },
  { title: "Business Settings", description: "Final setup options" },
];

export const SalonRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SalonFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('salon-registration-draft');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('salon-registration-draft', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (updates: Partial<SalonFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Basic Info
        return !!(formData.name.trim() && formData.phone.trim() && formData.address.trim());
      case 1: // Business Hours
        return formData.businessHours.some(hour => !hour.is_closed);
      case 2: // Services
        return formData.selectedServices.length > 0;
      case 3: // Business Settings
        return formData.maxQueueSize > 0 && formData.currentWaitTime > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to complete registration");
      return;
    }

    setLoading(true);
    try {
      // Create salon record
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .insert({
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          email: formData.email || user.email,
          phone: formData.phone,
          address: formData.address,
          image_url: formData.imageUrl,
          max_queue_size: formData.maxQueueSize,
          current_wait_time: formData.currentWaitTime,
          accepts_bookings: formData.acceptsBookings,
          status: 'approved',
          admin_approved: true,
        })
        .select()
        .maybeSingle();

      if (salonError) throw salonError;
      if (!salon) throw new Error('Failed to create salon record');

      // Create business hours
      const hoursToInsert = formData.businessHours.map(hour => ({
        salon_id: salon.id,
        ...hour,
      }));

      const { error: hoursError } = await supabase
        .from('salon_hours')
        .insert(hoursToInsert);

      if (hoursError) throw hoursError;

      // Create salon services
      const servicesToInsert = formData.selectedServices.map(service => ({
        salon_id: salon.id,
        service_id: service.service_id,
        price: service.price,
        duration: service.duration,
        is_active: true,
      }));

      const { error: servicesError } = await supabase
        .from('salon_services')
        .insert(servicesToInsert);

      if (servicesError) throw servicesError;

      // Clear localStorage draft
      localStorage.removeItem('salon-registration-draft');
      
      toast.success("Salon registration completed successfully!");
      navigate('/salon-dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'Failed to submit registration. Please try again.';
      toast.error(`Registration failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Salon Registration
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-center">
              <h3 className="font-medium">{steps[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 0 && (
            <BasicSalonInfo 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 1 && (
            <BusinessHoursSetup 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 2 && (
            <ServicesSetup 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 3 && (
            <BusinessSettings 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!validateCurrentStep()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !validateCurrentStep()}
              >
                {loading ? "Submitting..." : "Complete Registration"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};