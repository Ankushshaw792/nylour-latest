import { Badge } from "@/components/ui/badge";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";

interface SalonStatusBadgeProps {
  salonId: string;
  className?: string;
}

export const SalonStatusBadge = ({ salonId, className }: SalonStatusBadgeProps) => {
  const { isOpen, nextOpenInfo, isLoading } = useSalonOpenStatus(salonId);

  if (isLoading || isOpen === null) return null;

  return (
    <div className={className}>
      <Badge variant={isOpen ? "default" : "destructive"} className="font-medium">
        {isOpen ? "Open" : "Closed"}
      </Badge>
      {!isOpen && nextOpenInfo && (
        <p className="text-xs text-muted-foreground mt-1">{nextOpenInfo}</p>
      )}
    </div>
  );
};
