import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Trash2, 
  Star, 
  GripVertical,
  ImageIcon,
} from "lucide-react";
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

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
}

const MAX_VENUE_IMAGES = 10;
const MAX_PORTFOLIO_IMAGES = 15;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const GalleryManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [deleteImage, setDeleteImage] = useState<GalleryImage | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'venue' | 'portfolio'>('venue');

  useEffect(() => {
    const fetchSalonAndImages = async () => {
      if (!user) return;

      const { data: salon } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!salon) {
        navigate('/salon-register');
        return;
      }

      setSalonId(salon.id);

      const { data: galleryData } = await supabase
        .from('salon_images')
        .select('*')
        .eq('salon_id', salon.id)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });

      setImages(galleryData || []);
      setLoading(false);
    };

    fetchSalonAndImages();
  }, [user, navigate]);

  const venueImages = images.filter(img => !img.caption?.includes('[TYPE:PORTFOLIO]'));
  const portfolioImages = images.filter(img => img.caption?.includes('[TYPE:PORTFOLIO]'));
  
  const activeImages = activeTab === 'venue' ? venueImages : portfolioImages;
  const currentMax = activeTab === 'venue' ? MAX_VENUE_IMAGES : MAX_PORTFOLIO_IMAGES;

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !salonId) return;

    const remainingSlots = currentMax - activeImages.length;
    if (remainingSlots <= 0) {
      toast({ title: "Gallery full", description: `Maximum ${currentMax} images allowed in this section`, variant: "destructive" });
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
      const filePath = `${salonId}/${crypto.randomUUID()}.${ext}`;

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

      const nextOrder = images.length > 0 ? Math.max(...images.map(i => i.display_order)) + 1 : 0;
      const isPrimary = activeTab === 'venue' && venueImages.length === 0;
      const initialCaption = activeTab === 'portfolio' ? '[TYPE:PORTFOLIO]' : '';

      const { data: newImage, error: insertError } = await supabase
        .from('salon_images')
        .insert({
          salon_id: salonId,
          image_url: urlData.publicUrl,
          is_primary: isPrimary,
          display_order: nextOrder,
          caption: initialCaption
        })
        .select()
        .single();

      if (insertError) {
        toast({ title: "Save failed", description: insertError.message, variant: "destructive" });
        continue;
      }

      setImages(prev => [...prev, newImage]);
    }

    setUploading(false);
    toast({ title: "Upload complete", description: `${validFiles.length} image(s) added` });
  }, [salonId, images, activeTab, activeImages, currentMax, venueImages.length]);

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
      const newActiveImages = [...activeImages];
      const [draggedItem] = newActiveImages.splice(draggedIndex, 1);
      newActiveImages.splice(dragOverIndex, 0, draggedItem);

      const sortedOrders = [...activeImages].map(img => img.display_order).sort((a, b) => a - b);
      
      const updatedActiveImages = newActiveImages.map((img, i) => ({
        ...img,
        display_order: sortedOrders[i]
      }));

      const newImages = images.map(img => {
        const updated = updatedActiveImages.find(u => u.id === img.id);
        return updated || img;
      });
      
      setImages(newImages);

      await Promise.all(
        updatedActiveImages.map((img) =>
          supabase.from('salon_images').update({ display_order: img.display_order }).eq('id', img.id)
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

    setImages(prev => prev.filter(i => i.id !== deleteImage.id));
    setDeleteImage(null);
    toast({ title: "Image deleted" });
  };

  const setPrimary = async (imageId: string) => {
    await supabase
      .from('salon_images')
      .update({ is_primary: false })
      .eq('salon_id', salonId);

    await supabase
      .from('salon_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));

    toast({ title: "Cover photo updated" });
  };

  const updateCaption = async (imageId: string, displayCaption: string) => {
    const isPortfolio = activeTab === 'portfolio';
    const finalCaption = isPortfolio ? `[TYPE:PORTFOLIO] ${displayCaption}` : displayCaption;

    await supabase
      .from('salon_images')
      .update({ caption: finalCaption })
      .eq('id', imageId);

    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption: finalCaption } : img
    ));
  };


  if (loading) {
    return (
      <SalonDashboardLayout title="Manage Gallery">
        <div className="grid grid-cols-2 gap-4 p-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </SalonDashboardLayout>
    );
  }

  const renderUploadArea = () => (
    <div
      onDragEnter={handleFileDrag}
      onDragLeave={handleFileDrag}
      onDragOver={handleFileDrag}
      onDrop={handleFileDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        isDraggingFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      } ${activeImages.length >= currentMax ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="gallery-upload"
        disabled={activeImages.length >= currentMax || uploading}
      />
      <label htmlFor="gallery-upload" className="cursor-pointer">
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">
          {uploading ? 'Uploading...' : 'Drop images here or tap to upload'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {activeImages.length}/{currentMax} images • JPG, PNG, WebP up to 5MB
        </p>
      </label>
    </div>
  );

  const renderImageGrid = () => (
    <>
      {activeImages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">No images in this section yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload images to showcase your {activeTab === 'venue' ? 'salon' : 'work'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {activeImages.map((image, index) => {
            const displayCaption = (image.caption || '').replace('[TYPE:PORTFOLIO]', '').trim();
            
            return (
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
                    alt={displayCaption || 'Gallery image'}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {image.is_primary && activeTab === 'venue' && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      Cover
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="h-8 w-8 flex items-center justify-center bg-secondary/80 rounded-md">
                      <GripVertical className="h-4 w-4 text-foreground" />
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => setDeleteImage(image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {!image.is_primary && activeTab === 'venue' && (
                    <div className="absolute bottom-2 right-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => setPrimary(image.id)}
                        title="Set as cover"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <Input
                    placeholder="Add caption..."
                    value={displayCaption}
                    onChange={(e) => updateCaption(image.id, e.target.value)}
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <SalonDashboardLayout title="Manage Gallery">
      <div className="p-4 space-y-6 pb-24">
        
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'venue' | 'portfolio')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="venue">Salon Venue ({venueImages.length})</TabsTrigger>
            <TabsTrigger value="portfolio">Team Portfolio ({portfolioImages.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="venue" className="space-y-6">
            {renderUploadArea()}
            {renderImageGrid()}
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            {renderUploadArea()}
            {renderImageGrid()}
          </TabsContent>
        </Tabs>

      </div>

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

export default GalleryManagement;
