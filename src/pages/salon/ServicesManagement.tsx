import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Scissors, Edit, Plus, Trash2, GripVertical, Upload, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  id: string;
  service_id: string;
  price: number;
  duration: number;
  is_active: boolean;
  image_url: string | null;
  display_order: number;
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
  const [formData, setFormData] = useState({
    price: 0,
    duration: 30,
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  
  // Delete state
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // Custom service state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customServiceData, setCustomServiceData] = useState({
    name: "",
    description: "",
    price: 200,
    duration: 30,
  });

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
      .order('display_order', { ascending: true });

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

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      price: service.price,
      duration: service.duration,
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

  const handleDeleteService = async () => {
    if (!deleteService) return;

    // Delete image from storage if exists
    if (deleteService.image_url) {
      const fileName = deleteService.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('salon-images').remove([`services/${fileName}`]);
      }
    }

    const { error } = await supabase
      .from('salon_services')
      .delete()
      .eq('id', deleteService.id);

    if (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } else {
      toast.success('Service deleted successfully');
      setDeleteService(null);
      fetchServices();
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

    // Get next display order
    const maxOrder = services.length > 0 ? Math.max(...services.map(s => s.display_order)) : -1;

    const { error } = await supabase
      .from('salon_services')
      .insert({
        salon_id: salon.id,
        service_id: selectedServiceId,
        price: formData.price,
        duration: formData.duration,
        display_order: maxOrder + 1,
      });

    if (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    } else {
      toast.success('Service added successfully');
      setIsAddDialogOpen(false);
      setSelectedServiceId("");
      setFormData({ price: 0, duration: 30 });
      fetchServices();
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({ price: 0, duration: 30 });
    setSelectedServiceId("");
    setIsCustomMode(false);
    setCustomServiceData({ name: "", description: "", price: 200, duration: 30 });
    setIsAddDialogOpen(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const selectedService = availableServices.find(s => s.id === serviceId);
    if (selectedService) {
      setFormData({
        price: 0,
        duration: selectedService.default_duration,
      });
    }
  };

  // Filter out services that salon already has
  const getUnusedServices = () => {
    const existingServiceIds = services.map(s => s.service_id);
    return availableServices.filter(s => !existingServiceIds.includes(s.id));
  };

  // Add custom service handler
  const handleAddCustomService = async () => {
    if (!customServiceData.name.trim() || !salon?.id) {
      toast.error('Please enter a service name');
      return;
    }
    if (customServiceData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    // Step 1: Create the custom service in services table
    const { data: newService, error: serviceError } = await supabase
      .from('services')
      .insert({
        name: customServiceData.name.trim(),
        description: customServiceData.description.trim() || null,
        default_duration: customServiceData.duration,
      })
      .select()
      .single();

    if (serviceError) {
      console.error('Error creating service:', serviceError);
      toast.error('Failed to create custom service');
      return;
    }

    // Step 2: Link it to the salon
    const maxOrder = services.length > 0 ? Math.max(...services.map(s => s.display_order)) : -1;
    
    const { error: linkError } = await supabase
      .from('salon_services')
      .insert({
        salon_id: salon.id,
        service_id: newService.id,
        price: customServiceData.price,
        duration: customServiceData.duration,
        display_order: maxOrder + 1,
      });

    if (linkError) {
      console.error('Error linking service:', linkError);
      toast.error('Failed to add service to salon');
      return;
    }

    toast.success('Custom service added successfully');
    setIsAddDialogOpen(false);
    setCustomServiceData({ name: "", description: "", price: 200, duration: 30 });
    fetchServices();
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reorderedServices = [...services];
    const [draggedItem] = reorderedServices.splice(draggedIndex, 1);
    reorderedServices.splice(dragOverIndex, 0, draggedItem);

    // Update local state immediately
    setServices(reorderedServices);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Update display_order in database
    const updates = reorderedServices.map((service, index) => ({
      id: service.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('salon_services')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
  };

  // Image upload handler
  const handleImageUpload = useCallback(async (serviceId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingId(serviceId);

    const fileExt = file.name.split('.').pop();
    const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
    const filePath = `services/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('salon-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload image');
      setUploadingId(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('salon-images')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('salon_services')
      .update({ image_url: publicUrl })
      .eq('id', serviceId);

    if (updateError) {
      console.error('Update error:', updateError);
      toast.error('Failed to save image');
    } else {
      toast.success('Image uploaded successfully');
      fetchServices();
    }

    setUploadingId(null);
  }, []);

  const handleRemoveImage = async (service: Service) => {
    if (!service.image_url) return;

    const fileName = service.image_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('salon-images').remove([`services/${fileName}`]);
    }

    const { error } = await supabase
      .from('salon_services')
      .update({ image_url: null })
      .eq('id', service.id);

    if (error) {
      toast.error('Failed to remove image');
    } else {
      toast.success('Image removed');
      fetchServices();
    }
  };

  if (authLoading || salonLoading) {
    return (
      <SalonDashboardLayout title="Services" description="Manage your salon services">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </SalonDashboardLayout>
    );
  }

  return (
    <SalonDashboardLayout title="Services" description="Manage your salon services">
      <div className="space-y-4">
        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No services found</p>
              <p className="text-sm text-muted-foreground mb-4">Add services to your salon to get started</p>
              <Button onClick={handleOpenAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service, index) => (
                <Card 
                  key={service.id} 
                  className={`overflow-hidden transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${dragOverIndex === index ? 'ring-2 ring-primary' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Image section */}
                  <div className="relative h-32 bg-muted">
                    {service.image_url ? (
                      <>
                        <img 
                          src={service.image_url} 
                          alt={service.services.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(service)}
                          className="absolute top-2 left-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Top right controls: Drag + Delete */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <div className="p-1.5 bg-black/50 rounded cursor-grab text-white">
                        <GripVertical className="h-3 w-3" />
                      </div>
                      <button
                        onClick={() => setDeleteService(service)}
                        className="p-1.5 bg-red-500/80 rounded text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Upload button */}
                    <label className="absolute bottom-2 right-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(service.id, file);
                        }}
                        disabled={uploadingId === service.id}
                      />
                      <div className={`flex items-center gap-1 px-2 py-1 bg-black/50 rounded text-white text-xs cursor-pointer hover:bg-black/70 ${uploadingId === service.id ? 'opacity-50' : ''}`}>
                        <Upload className="h-3 w-3" />
                        {uploadingId === service.id ? 'Uploading...' : 'Add Image'}
                      </div>
                    </label>
                  </div>

                  {/* Card content */}
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm truncate">{service.services.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">₹{service.price}</span>
                      <span>·</span>
                      <span>{service.duration} min</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Add More Services Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleOpenAddDialog}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More Services
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteService?.services.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <Label htmlFor="price">Price (₹)</Label>
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

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveService}>
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
            {/* Toggle Tabs */}
            <div className="flex gap-2">
              <Button
                variant={!isCustomMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustomMode(false)}
                className="flex-1"
              >
                Select Pre-made
              </Button>
              <Button
                variant={isCustomMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustomMode(true)}
                className="flex-1"
              >
                Create Custom
              </Button>
            </div>

            {!isCustomMode ? (
              <>
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
                      <Label htmlFor="add-price">Price (₹)</Label>
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
                  </>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddNewService} 
                    disabled={!selectedServiceId || formData.price <= 0}
                  >
                    Add Service
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="custom-name">Service Name *</Label>
                  <Input
                    id="custom-name"
                    placeholder="e.g., Hair Spa Treatment"
                    value={customServiceData.name}
                    onChange={(e) => setCustomServiceData({ ...customServiceData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="custom-description">Description (optional)</Label>
                  <Input
                    id="custom-description"
                    placeholder="Brief description of the service"
                    value={customServiceData.description}
                    onChange={(e) => setCustomServiceData({ ...customServiceData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-price">Price (₹)</Label>
                    <Input
                      id="custom-price"
                      type="number"
                      value={customServiceData.price || ""}
                      onChange={(e) => setCustomServiceData({ ...customServiceData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-duration">Duration (min)</Label>
                    <Input
                      id="custom-duration"
                      type="number"
                      value={customServiceData.duration}
                      onChange={(e) => setCustomServiceData({ ...customServiceData, duration: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddCustomService} 
                    disabled={!customServiceData.name.trim() || customServiceData.price <= 0}
                  >
                    Add Custom Service
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SalonDashboardLayout>
  );
};

export default ServicesManagement;
