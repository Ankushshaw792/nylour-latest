import { useState } from "react";
import { Users, Plus, Minus, User, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Companion {
  name: string;
  phone: string;
}

interface CompanionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (companions: Companion[]) => void;
  initialCompanions?: Companion[];
}

export const CompanionDetailsDialog = ({
  isOpen,
  onClose,
  onConfirm,
  initialCompanions = [],
}: CompanionDetailsDialogProps) => {
  const [count, setCount] = useState(initialCompanions.length || 1);
  const [companions, setCompanions] = useState<Companion[]>(
    initialCompanions.length > 0
      ? initialCompanions
      : [{ name: "", phone: "" }]
  );

  const handleCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(4, count + delta));
    setCount(newCount);
    
    if (newCount > companions.length) {
      // Add empty companions
      const newCompanions = [...companions];
      for (let i = companions.length; i < newCount; i++) {
        newCompanions.push({ name: "", phone: "" });
      }
      setCompanions(newCompanions);
    } else if (newCount < companions.length) {
      // Remove extra companions
      setCompanions(companions.slice(0, newCount));
    }
  };

  const updateCompanion = (index: number, field: keyof Companion, value: string) => {
    const updated = [...companions];
    updated[index] = { ...updated[index], [field]: value };
    setCompanions(updated);
  };

  const isValid = companions.every(
    (c) => c.name.trim().length > 0 && c.phone.trim().length >= 10
  );

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(companions);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Add Companions
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2">
          {/* Count selector */}
          <div className="bg-muted/50 rounded-lg p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">
              How many people are joining you?
            </Label>
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCountChange(-1)}
                disabled={count <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold w-8 text-center">{count}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCountChange(1)}
                disabled={count >= 4}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Maximum 4 companions per booking
            </p>
          </div>

          {/* Companion forms */}
          <div className="space-y-4">
            {companions.map((companion, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 bg-card"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Companion {index + 1}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`name-${index}`} className="text-xs">
                      Full Name *
                    </Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Enter name"
                      value={companion.name}
                      onChange={(e) => updateCompanion(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${index}`} className="text-xs">
                      Mobile Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`phone-${index}`}
                        placeholder="10-digit number"
                        value={companion.phone}
                        onChange={(e) => updateCompanion(index, "phone", e.target.value)}
                        className="pl-10"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirm ({count + 1} people total)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
