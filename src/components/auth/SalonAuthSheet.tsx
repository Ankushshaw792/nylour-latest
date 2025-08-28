import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalonSignInForm } from "./SalonSignInForm";
import { SalonSignUpForm } from "./SalonSignUpForm";

interface SalonAuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
}

export const SalonAuthSheet = ({ open, onOpenChange, onAuthSuccess }: SalonAuthSheetProps) => {
  const [activeTab, setActiveTab] = useState("signup");

  console.log("SalonAuthSheet render - open:", open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="text-2xl font-bold gradient-text">
            Join Nylour as a Salon Owner
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 px-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signup" className="text-sm font-medium">
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="signin" className="text-sm font-medium">
                Sign In
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup" className="space-y-4 mt-0">
              <SalonSignUpForm 
                onSuccess={onAuthSuccess}
                onSwitchToSignIn={() => setActiveTab("signin")}
              />
            </TabsContent>
            
            <TabsContent value="signin" className="space-y-4 mt-0">
              <SalonSignInForm onSuccess={onAuthSuccess} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};