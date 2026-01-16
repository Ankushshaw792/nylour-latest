import { MapPinOff, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NO_SALONS_MESSAGE, NO_SALONS_SUB_MESSAGE } from "@/lib/locationConfig";

interface NoSalonsInAreaProps {
  onChangeLocation?: () => void;
  className?: string;
}

export const NoSalonsInArea = ({ onChangeLocation, className }: NoSalonsInAreaProps) => {
  return (
    <Card className={className}>
      <CardContent className="py-12 px-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPinOff className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {NO_SALONS_MESSAGE}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
          {NO_SALONS_SUB_MESSAGE}
        </p>

        {onChangeLocation && (
          <Button 
            variant="outline" 
            onClick={onChangeLocation}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            Change Location
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
