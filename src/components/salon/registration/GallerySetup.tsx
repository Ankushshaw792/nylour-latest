import { useRef, useState } from "react";
import { SalonFormData } from "../SalonRegistrationForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Star, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface GallerySetupProps {
  formData: SalonFormData;
  updateFormData: (updates: Partial<SalonFormData>) => void;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const GallerySetup = ({ formData, updateFormData }: GallerySetupProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const galleryImages = formData.galleryImages || [];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const currentCount = galleryImages.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const validFiles: Array<{
      id: string;
      file: File;
      url: string;
      caption: string;
      isPrimary: boolean;
    }> = [];

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only JPG, PNG, and WebP files are allowed`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File size must be under 5MB`);
        return;
      }

      validFiles.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        caption: "",
        isPrimary: currentCount === 0 && validFiles.length === 0, // First image is primary
      });
    });

    if (validFiles.length > 0) {
      updateFormData({
        galleryImages: [...galleryImages, ...validFiles],
      });
      toast.success(`${validFiles.length} image(s) added`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    const updatedImages = galleryImages.filter((img) => img.id !== id);
    // If we removed the primary image, make the first remaining one primary
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }
    updateFormData({ galleryImages: updatedImages });
  };

  const setPrimaryImage = (id: string) => {
    const updatedImages = galleryImages.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    updateFormData({ galleryImages: updatedImages });
  };

  const updateCaption = (id: string, caption: string) => {
    const updatedImages = galleryImages.map((img) =>
      img.id === id ? { ...img, caption } : img
    );
    updateFormData({ galleryImages: updatedImages });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Salon Gallery
        </h3>
        <p className="text-sm text-muted-foreground">
          Showcase your salon with beautiful photos to attract customers
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Drop images here or click to browse</p>
        <p className="text-sm text-muted-foreground mt-1">
          JPG, PNG, WebP • Max 5MB each • Up to {MAX_IMAGES} images
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {galleryImages.length}/{MAX_IMAGES} images uploaded
        </p>
      </div>

      {/* Image Grid */}
      {galleryImages.length > 0 && (
        <div className="space-y-3">
          <Label>Uploaded Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <Card key={image.id} className="overflow-hidden group relative">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={`Salon image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Cover
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!image.isPrimary && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryImage(image.id);
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Set Cover
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div className="p-2">
                    <Input
                      placeholder="Add caption..."
                      value={image.caption}
                      onChange={(e) => updateCaption(image.id, e.target.value)}
                      className="text-xs h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Tips for great photos:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• The first image will be your salon's cover photo</li>
                <li>• Show your workspace, chairs, and ambiance</li>
                <li>• Include photos of your best work (haircuts, styles)</li>
                <li>• High-quality, well-lit photos attract more customers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {galleryImages.length === 0 && (
        <p className="text-sm text-destructive text-center">
          Please upload at least one image of your salon
        </p>
      )}
    </div>
  );
};
