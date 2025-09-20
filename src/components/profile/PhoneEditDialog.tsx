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

const phoneSchema = z.object({
  phone: z.string().optional(),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

interface PhoneEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhone: string | null;
  onPhoneUpdate: () => void;
}

export const PhoneEditDialog = ({
  open,
  onOpenChange,
  currentPhone,
  onPhoneUpdate,
}: PhoneEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: currentPhone || "",
    },
  });

  const onSubmit = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        toast.error("Failed to update phone number");
        console.error("Phone update error:", error);
      } else {
        toast.success("Phone number updated successfully");
        onPhoneUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Phone update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Phone Number</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
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