import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  indianPhoneValidation, 
  isValidIndianPhone, 
  stripPhonePrefix,
  PHONE_WARNING_MESSAGE 
} from "@/lib/phoneValidation";

const phoneSchema = z.object({
  phone: z.string()
    .optional()
    .refine(indianPhoneValidation, {
      message: "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)",
    }),
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

  const phoneValue = form.watch("phone");
  const showWarning = phoneValue && isValidIndianPhone(phoneValue);

  const onSubmit = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      // Store only the 10-digit number
      const cleanedPhone = data.phone ? stripPhonePrefix(data.phone) : null;
      
      const { error } = await supabase
        .from("customers")
        .update({
          phone: cleanedPhone,
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
                    <Input 
                      placeholder="Enter 10-digit mobile number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showWarning && (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                  {PHONE_WARNING_MESSAGE}
                </AlertDescription>
              </Alert>
            )}

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