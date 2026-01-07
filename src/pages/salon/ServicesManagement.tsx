import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Scissors, Upload, Edit, Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  id: string;
  service_id: string;
  price: number;
  duration: number;
  is_active: boolean;
  image_url: string | null;
  services: {
    name: string;
    description: string | null;
  };
}

interface AvailableService {
  id: string;
  name: string;
  description: string | null;
  default_duration: number;
}

const ServicesManagement = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { salon, loading: salonLoading } = useSalonRealtimeData();
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    price: 0,
    duration: 30,
    image_url: null as string | null,
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Fetch salon services
  const fetchServices = async () => {
    if (!salon?.id) return;

    const { data, error } = await supabase
      .from('salon_services')
      .select(`
        *,
        services:service_id (
          name,
          description
        )
      `)
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } else {
      setServices(data || []);
    }
  };

  // Fetch available services from the services table
  const fetchAvailableServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching available services:', error);
    } else {
      setAvailableServices(data || []);
    }
  };

  // Load services when salon is ready
  useEffect(() => {
    if (salon?.id) {
      fetchServices();
      fetchAvailableServices();
    }
  }, [salon?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !salon?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${salon.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      price: service.price,
      duration: service.duration,
      image_url: service.image_url,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!editingService) return;

    const { error } = await supabase
      .from('salon_services')
      .update({
        price: formData.price,
        duration: formData.duration,
        image_url: formData.image_url,
      })
      .eq('id', editingService.id);

    if (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    } else {
      toast.success('Service updated successfully');
      setIsEditDialogOpen(false);
      fetchServices();
    }
  };

  const handleDeleteImage = async () => {
    if (!editingService?.image_url) return;

    try {
      const imagePath = editingService.image_url.split('/service-images/')[1];
      if (imagePath) {
        await supabase.storage
          .from('service-images')
          .remove([imagePath]);
      }

      setFormData({ ...formData, image_url: null });
      toast.success('Image removed');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleAddNewService = async () => {
    if (!selectedServiceId || !salon?.id) {
      toast.error('Please select a service');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const { error } = await supabase
      .from('salon_services')
      .insert({
        salon_id: salon.id,
        service_id: selectedServiceId,
        price: formData.price,
        duration: formData.duration,
        image_url: formData.image_url,
      });

    if (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    } else {
      toast.success('Service added successfully');
      setIsAddDialogOpen(false);
      setSelectedServiceId("");
      setFormData({ price: 0, duration: 30, image_url: null });
      fetchServices();
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({ price: 0, duration: 30, image_url: null });
    setSelectedServiceId("");
    setIsAddDialogOpen(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const selectedService = availableServices.find(s => s.id === serviceId);
    if (selectedService) {
      setFormData({
        price: 0,
        duration: selectedService.default_duration,
        image_url: null,
      });
    }
  };

  // Filter out services that salon already has
  const getUnusedServices = () => {
    const existingServiceIds = services.map(s => s.service_id);
    return availableServices.filter(s => !existingServiceIds.includes(s.id));
  };

  if (authLoading || salonLoading) {
    return (
      <SalonDashboardLayout title="Services" description="Manage your salon services">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </SalonDashboardLayout>
    );
  }

  return (
    <SalonDashboardLayout title="Services" description="Manage your salon services and upload images">
      <div className="space-y-6">
        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No services found</p>
              <p className="text-sm text-muted-foreground">Add services to your salon to get started</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  <div className="relative h-48 bg-muted">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.services.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{service.services.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${service.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{service.duration} min</span>
                    </div>
                    {service.services.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {service.services.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Add More Services Button */}
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleOpenAddDialog}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Add More Services
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div>
                <Label>Service Name</Label>
                <Input
                  value={editingService.services.name}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label>Service Image</Label>
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Service"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleDeleteImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        Click to upload image
                      </span>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveService} disabled={uploading}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-select">Select Service</Label>
              <select
                id="service-select"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={selectedServiceId}
                onChange={(e) => handleServiceSelect(e.target.value)}
              >
                <option value="">Choose a service...</option>
                {getUnusedServices().map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {getUnusedServices().length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  All available services have been added
                </p>
              )}
            </div>

            {selectedServiceId && (
              <>
                <div>
                  <Label htmlFor="add-price">Price ($)</Label>
                  <Input
                    id="add-price"
                    type="number"
                    placeholder="Enter price"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="add-duration">Duration (minutes)</Label>
                  <Input
                    id="add-duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                  />
                </div>

                <div>
                  <Label>Service Image (Optional)</Label>
                  {formData.image_url ? (
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt="Service"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, image_url: null })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-md p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <Label htmlFor="add-image-upload" className="cursor-pointer">
                        <span className="text-sm text-primary hover:underline">
                          Click to upload image
                        </span>
                        <Input
                          id="add-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddNewService} 
                disabled={!selectedServiceId || uploading || formData.price <= 0}
              >
                Add Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SalonDashboardLayout>
  );
};

export default ServicesManagement;
