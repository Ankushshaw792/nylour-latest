import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SalonFormData } from "../SalonRegistrationForm";

interface BasicSalonInfoProps {
  formData: SalonFormData;
  updateFormData: (updates: Partial<SalonFormData>) => void;
}

export const BasicSalonInfo = ({ formData, updateFormData }: BasicSalonInfoProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="salonName">Salon Name *</Label>
        <Input
          id="salonName"
          placeholder="Enter your salon name"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell customers about your salon (services, atmosphere, specialties)"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Contact Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="salon@example.com"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Salon Address *</Label>
        <Textarea
          id="address"
          placeholder="Enter your complete salon address including street, city, state, and postal code"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          rows={2}
          required
        />
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Important Notes:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Fields marked with * are required</li>
          <li>• Your salon name will be displayed to customers</li>
          <li>• Provide accurate contact information for customer inquiries</li>
          <li>• Complete address helps customers find your location</li>
        </ul>
      </div>
    </div>
  );
};