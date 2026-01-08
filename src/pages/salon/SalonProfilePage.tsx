import { useState, useEffect, useCallback } from "react";
import { LogOut, Pause, Clock, Users, TrendingUp, Settings, BarChart3, Eye, Wifi, ImageIcon, Upload, Trash2, Star, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import NotificationControls from "@/components/salon/NotificationControls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QueueStats {
  currentWaitTime: number;
  queueLength: number;
  avgServiceTime: number;
  capacity: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SalonProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(true);
  const [waitTime, setWaitTime] = useState(30);
  const [stats, setStats] = useState<QueueStats>({
    currentWaitTime: 25,
    queueLength: 8,
    avgServiceTime: 45,
    capacity: 12
  });
  const [salon, setSalon] = useState<any>(null);
  
  // Gallery states
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [deleteImage, setDeleteImage] = useState<GalleryImage | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!salonData) return;
        setSalon(salonData);

        // Fetch gallery images
        const { data: galleryData } = await supabase
          .from('salon_images')
          .select('*')
          .eq('salon_id', salonData.id)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true });

        setGalleryImages(galleryData || []);
      } catch (error) {
        console.error('Error fetching salon data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonData();
  }, [user]);

  // Gallery handlers
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !salon?.id) return;

    const remainingSlots = MAX_IMAGES - galleryImages.length;
    if (remainingSlots <= 0) {
      toast({ title: "Gallery full", description: `Maximum ${MAX_IMAGES} images allowed`, variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToUpload.filter(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: "Invalid format", description: `${file.name} must be JPG, PNG, or WebP`, variant: "destructive" });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB limit`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    for (const file of validFiles) {
      const ext = file.name.split('.').pop();
      const filePath = `${salon.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('salon-images')
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('salon-images')
        .getPublicUrl(filePath);

      const nextOrder = galleryImages.length > 0 ? Math.max(...galleryImages.map(i => i.display_order)) + 1 : 0;
      const isPrimary = galleryImages.length === 0;

      const { data: newImage, error: insertError } = await supabase
        .from('salon_images')
        .insert({
          salon_id: salon.id,
          image_url: urlData.publicUrl,
          is_primary: isPrimary,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (insertError) {
        toast({ title: "Save failed", description: insertError.message, variant: "destructive" });
        continue;
      }

      setGalleryImages(prev => [...prev, newImage]);
    }

    setUploading(false);
    toast({ title: "Upload complete", description: `${validFiles.length} image(s) added` });
  }, [salon?.id, galleryImages, toast]);

  const handleFileDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(e.type === 'dragenter' || e.type === 'dragover');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.types.includes('Files')) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...galleryImages];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedItem);

      setGalleryImages(newImages.map((img, i) => ({ ...img, display_order: i })));

      await Promise.all(
        newImages.map((img, i) =>
          supabase.from('salon_images').update({ display_order: i }).eq('id', img.id)
        )
      );

      toast({ title: "Order updated" });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const confirmDelete = async () => {
    if (!deleteImage) return;

    const urlParts = deleteImage.image_url.split('/salon-images/');
    if (urlParts.length > 1) {
      await supabase.storage.from('salon-images').remove([urlParts[1]]);
    }

    await supabase.from('salon_images').delete().eq('id', deleteImage.id);

    setGalleryImages(prev => prev.filter(i => i.id !== deleteImage.id));
    setDeleteImage(null);
    toast({ title: "Image deleted" });
  };

  const setPrimary = async (imageId: string) => {
    await supabase
      .from('salon_images')
      .update({ is_primary: false })
      .eq('salon_id', salon?.id);

    await supabase
      .from('salon_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    setGalleryImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));

    toast({ title: "Cover photo updated" });
  };

  const updateCaption = async (imageId: string, caption: string) => {
    await supabase
      .from('salon_images')
      .update({ caption })
      .eq('id', imageId);

    setGalleryImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleUpdateWaitTime = () => {
    toast({
      title: "Wait time updated",
      description: `Current wait time set to ${waitTime} minutes`,
    });
  };

  const handleQuickTimeUpdate = (minutes: number) => {
    setWaitTime(minutes);
    handleUpdateWaitTime();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SalonDashboardLayout>
      <div className="p-4 space-y-4">
        {/* Stop Bookings Button */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Booking Control</h3>
                <p className="text-sm text-gray-500">
                  {bookingStatus ? "Currently accepting new bookings" : "Bookings are paused"}
                </p>
              </div>
              <Button 
                variant={bookingStatus ? "destructive" : "default"}
                onClick={() => setBookingStatus(!bookingStatus)}
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                {bookingStatus ? "Stop Bookings" : "Resume Bookings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.currentWaitTime}m</p>
              <p className="text-xs text-gray-500">Current Wait Time</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.queueLength}</p>
              <p className="text-xs text-gray-500">Queue Length</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.avgServiceTime}m</p>
              <p className="text-xs text-gray-500">Avg Service Time</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <Wifi className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.capacity}</p>
              <p className="text-xs text-gray-500">Capacity</p>
            </CardContent>
          </Card>
        </div>

        {/* Update Wait Time */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5" />
              Update Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="waitTime" className="text-gray-700">Current Wait Time (minutes)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="waitTime"
                  type="number"
                  value={waitTime}
                  onChange={(e) => setWaitTime(Number(e.target.value))}
                  className="flex-1 border-gray-200"
                />
                <Button onClick={handleUpdateWaitTime}>Update</Button>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(15)}>
                15 min
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(30)}>
                30 min
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(45)}>
                45 min
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(60)}>
                1 hour
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Wait Time Guidelines</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Update regularly based on current queue</li>
                <li>• Consider service complexity and staff availability</li>
                <li>• Communicate changes to waiting customers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Toggle */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Booking Status</p>
                <p className="text-sm text-gray-500">
                  Allow new customers to book appointments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bookingStatus ? "default" : "secondary"}>
                  {bookingStatus ? "Open" : "Closed"}
                </Badge>
                <Switch
                  checked={bookingStatus}
                  onCheckedChange={setBookingStatus}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salon Gallery Section */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ImageIcon className="h-5 w-5" />
              Salon Gallery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div
              onDragEnter={handleFileDrag}
              onDragLeave={handleFileDrag}
              onDragOver={handleFileDrag}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                isDraggingFile ? 'border-primary bg-primary/5' : 'border-gray-300'
              } ${galleryImages.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="gallery-upload"
                disabled={galleryImages.length >= MAX_IMAGES || uploading}
              />
              <label htmlFor="gallery-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading...' : 'Drop images or tap to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {galleryImages.length}/{MAX_IMAGES} images • JPG, PNG, WebP up to 5MB
                </p>
              </label>
            </div>

            {/* Image Grid */}
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.map((image, index) => (
                  <Card 
                    key={image.id}
                    className={`overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
                    } ${dragOverIndex === index ? 'ring-2 ring-primary' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.caption || 'Gallery image'}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      {image.is_primary && (
                        <Badge className="absolute top-2 left-2 bg-primary">
                          Cover
                        </Badge>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="h-7 w-7 flex items-center justify-center bg-secondary/80 rounded-md">
                          <GripVertical className="h-4 w-4 text-foreground" />
                        </div>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={() => setDeleteImage(image)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {!image.is_primary && (
                        <div className="absolute bottom-2 right-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7"
                            onClick={() => setPrimary(image.id)}
                            title="Set as cover"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <Input
                        placeholder="Add caption..."
                        value={image.caption || ''}
                        onChange={(e) => updateCaption(image.id, e.target.value)}
                        className="text-xs h-8"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No gallery images yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload images to showcase your salon</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Controls */}
        {salon && (
          <NotificationControls salonId={salon.id} />
        )}

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => navigate('/salon-dashboard')}>
                <Eye className="h-5 w-5" />
                <span className="text-xs">View Queue</span>
              </Button>
              
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <Settings className="h-5 w-5" />
                <span className="text-xs">Salon Settings</span>
              </Button>
              
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>
              
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <Users className="h-5 w-5" />
                <span className="text-xs">Customers</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="lg"
          className="w-full gap-2"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteImage} onOpenChange={() => setDeleteImage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this image from your gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalonDashboardLayout>
  );
};

export default SalonProfilePage;