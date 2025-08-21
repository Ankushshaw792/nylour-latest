import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthSheet = ({ open, onOpenChange }: AuthSheetProps) => {
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="text-2xl font-bold gradient-text">
            Welcome to Nylour
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 px-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="text-sm font-medium">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm font-medium">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-0">
              <SignInForm onSuccess={() => onOpenChange(false)} />
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-0">
              <SignUpForm 
                onSuccess={() => onOpenChange(false)}
                onSwitchToSignIn={() => setActiveTab("signin")}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};