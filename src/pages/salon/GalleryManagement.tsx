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
import { 
  Upload, 
  Trash2, 
  Star, 
  ChevronUp, 
  ChevronDown, 
  ImageIcon,
  X
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

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const GalleryManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteImage, setDeleteImage] = useState<GalleryImage | null>(null);

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

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !salonId) return;

    const remainingSlots = MAX_IMAGES - images.length;
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
      const isPrimary = images.length === 0;

      const { data: newImage, error: insertError } = await supabase
        .from('salon_images')
        .insert({
          salon_id: salonId,
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

      setImages(prev => [...prev, newImage]);
    }

    setUploading(false);
    toast({ title: "Upload complete", description: `${validFiles.length} image(s) added` });
  }, [salonId, images]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const confirmDelete = async () => {
    if (!deleteImage) return;

    // Extract file path from URL
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
    // First, unset all as primary
    await supabase
      .from('salon_images')
      .update({ is_primary: false })
      .eq('salon_id', salonId);

    // Then set the selected one as primary
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

  const updateCaption = async (imageId: string, caption: string) => {
    await supabase
      .from('salon_images')
      .update({ caption })
      .eq('id', imageId);

    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];

    // Update display_order for both
    await Promise.all([
      supabase.from('salon_images').update({ display_order: newIndex }).eq('id', images[index].id),
      supabase.from('salon_images').update({ display_order: index }).eq('id', images[newIndex].id),
    ]);

    setImages(newImages.map((img, i) => ({ ...img, display_order: i })));
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

  return (
    <SalonDashboardLayout title="Manage Gallery">
      <div className="p-4 space-y-6 pb-24">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
          } ${images.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="gallery-upload"
            disabled={images.length >= MAX_IMAGES || uploading}
          />
          <label htmlFor="gallery-upload" className="cursor-pointer">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">
              {uploading ? 'Uploading...' : 'Drop images here or tap to upload'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {images.length}/{MAX_IMAGES} images • JPG, PNG, WebP up to 5MB
            </p>
          </label>
        </div>

        {/* Image Grid */}
        {images.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No gallery images yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload images to showcase your salon
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {images.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={image.image_url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover"
                  />
                  {image.is_primary && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      Cover
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => setDeleteImage(image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {!image.is_primary && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => setPrimary(image.id)}
                        title="Set as cover"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    {index > 0 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => moveImage(index, 'up')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < images.length - 1 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => moveImage(index, 'down')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <Input
                    placeholder="Add caption..."
                    value={image.caption || ''}
                    onChange={(e) => updateCaption(image.id, e.target.value)}
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
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
