import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const preferencesSchema = z.object({
  favorite_services: z.string().optional(),
  preferred_time: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreferences: {
    favorite_services: any;
    preferred_time: string | null;
  };
  onPreferencesUpdate: () => void;
}

export const PreferencesEditDialog = ({
  open,
  onOpenChange,
  currentPreferences,
  onPreferencesUpdate,
}: PreferencesEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      favorite_services: Array.isArray(currentPreferences.favorite_services) 
        ? currentPreferences.favorite_services.join(", ") 
        : "",
      preferred_time: currentPreferences.preferred_time || "",
    },
  });

  const onSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true);
    try {
      const favoriteServicesArray = data.favorite_services 
        ? data.favorite_services.split(",").map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const { error } = await supabase
        .from("customers")
        .update({
          favorite_services: favoriteServicesArray,
          preferred_time: data.preferred_time,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        toast.error("Failed to update preferences");
        console.error("Preferences update error:", error);
      } else {
        toast.success("Preferences updated successfully");
        onPreferencesUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Preferences update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Preferences</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="favorite_services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorite Services</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter services separated by commas (e.g., Haircut, Beard Trim)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9:00 AM - 12:00 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                      <SelectItem value="evening">Evening (5:00 PM - 9:00 PM)</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};