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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const addressSchema = z.object({
  address: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAddress: string | null;
  onAddressUpdate: () => void;
}

export const AddressEditDialog = ({
  open,
  onOpenChange,
  currentAddress,
  onAddressUpdate,
}: AddressEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: currentAddress || "",
    },
  });

  const onSubmit = async (data: AddressFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          address: data.address,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        toast.error("Failed to update address");
        console.error("Address update error:", error);
      } else {
        toast.success("Address updated successfully");
        onAddressUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Address update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Address</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your address" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
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