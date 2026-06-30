import { useState, useEffect } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { ArrowLeft, Save, Store, Phone, MapPin, UserSquare, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SalonLocationPicker } from "@/components/salon/SalonLocationPicker";

const StoreInfoPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [ownerName, setOwnerName] = useState("");
  const [ownerImage, setOwnerImage] = useState<string | null>(null);
  const [ownerImageFile, setOwnerImageFile] = useState<File | null>(null);
  const [existingOwnerImageId, setExistingOwnerImageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (salonData) {
          setSalonId(salonData.id);
          setFormData({
            name: salonData.name || "",
            description: salonData.description || "",
            address: salonData.address || "",
            city: salonData.city || "",
            phone: salonData.phone || "",
            email: salonData.email || "",
            latitude: salonData.latitude ? Number(salonData.latitude) : null,
            longitude: salonData.longitude ? Number(salonData.longitude) : null,
          });

          // Fetch owner image
          const { data: galleryData } = await supabase
            .from('salon_images')
            .select('*')
            .eq('salon_id', salonData.id);

          if (galleryData) {
            const ownerImg = galleryData.find(img => img.caption?.includes('[TYPE:OWNER]'));
            if (ownerImg) {
              setOwnerImage(ownerImg.image_url);
              setExistingOwnerImageId(ownerImg.id);
              setOwnerName((ownerImg.caption || "").replace('[TYPE:OWNER]', '').trim());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching salon data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonData();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Image must be under 5MB", variant: "destructive" });
        return;
      }
      setOwnerImageFile(file);
      const url = URL.createObjectURL(file);
      setOwnerImage(url);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('salons')
        .update(formData)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Handle Owner Image / Name update
      if ((ownerImageFile || ownerName) && salonId) {
        let finalImageUrl = ownerImage;

        if (ownerImageFile) {
          const ext = ownerImageFile.name.split('.').pop();
          const filePath = `${salonId}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('salon-images')
            .upload(filePath, ownerImageFile);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('salon-images')
            .getPublicUrl(filePath);
            
          finalImageUrl = urlData.publicUrl;
        }

        const finalCaption = `[TYPE:OWNER] ${ownerName}`;

        if (existingOwnerImageId && finalImageUrl) {
          await supabase
            .from('salon_images')
            .update({
              image_url: finalImageUrl,
              caption: finalCaption
            })
            .eq('id', existingOwnerImageId);
        } else if (finalImageUrl) {
          const { data: newImg } = await supabase
            .from('salon_images')
            .insert({
              salon_id: salonId,
              image_url: finalImageUrl,
              caption: finalCaption,
              is_primary: false,
              display_order: 999
            })
            .select()
            .single();
            
          if (newImg) setExistingOwnerImageId(newImg.id);
        }
      }

      toast({
        title: "Store info updated",
        description: "Your store information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving salon data:', error);
      toast({
        title: "Error",
        description: "Failed to save store information.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SalonLoader size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/salon-dashboard/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Store Info</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Meet your Host Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserSquare className="h-5 w-5" />
              Owner Profile (Meet your host)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative group">
                <div className={`w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center ${!ownerImage ? 'bg-muted' : ''}`}>
                  {ownerImage ? (
                    <img src={ownerImage} alt="Owner" className="w-full h-full object-cover" />
                  ) : (
                    <UserSquare className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Upload className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </div>
                {ownerImage && (
                  <button 
                    onClick={() => {
                      setOwnerImage(null);
                      setOwnerImageFile(null);
                    }}
                    className="absolute top-0 right-0 bg-destructive text-white rounded-full p-1 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">Tap to upload a profile picture<br/>(Max 5MB)</p>
            </div>
            
            <div>
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Shweta"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter store name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your store"
                className="mt-1.5"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalonLocationPicker
              address={formData.address}
              city={formData.city}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={(locationData) => {
                setFormData({
                  ...formData,
                  address: locationData.address,
                  city: locationData.city,
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                });
              }}
            />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-5 w-5" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full gap-2">
          <Save className="h-5 w-5" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default StoreInfoPage;
