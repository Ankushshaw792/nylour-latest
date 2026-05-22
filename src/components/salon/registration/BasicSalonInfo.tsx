import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SalonFormData } from "../SalonRegistrationForm";
import { SalonLocationPicker } from "../SalonLocationPicker";

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

      <div className="space-y-3">
        <Label>Geographic Coordinates *</Label>
        <SalonLocationPicker
          address={formData.address}
          city={formData.city}
          latitude={formData.latitude}
          longitude={formData.longitude}
          onChange={(data) => updateFormData({
            address: data.address,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude
          })}
        />
      </div>

      {formData.latitude !== null && formData.longitude !== null && (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-3 border-b bg-muted/30">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Location Preview
            </h4>
          </div>
          <div className="relative aspect-video w-full">
            <iframe
              title="Salon Location Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.005}%2C${formData.latitude - 0.005}%2C${formData.longitude + 0.005}%2C${formData.latitude + 0.005}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`}
            />
          </div>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Important Notes:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Fields marked with * are required</li>
          <li>• Your salon name will be displayed to customers</li>
          <li>• Provide accurate contact information for customer inquiries</li>
          <li>• Complete address and accurate GPS pin helps customers find your location</li>
        </ul>
      </div>
    </div>
  );
};