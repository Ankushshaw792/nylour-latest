import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  salonId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const FavoriteButton = ({ salonId, size = "md", className }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(salonId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(salonId);
  };

  const sizeClasses = {
    sm: "h-8 w-8 p-0",
    md: "h-9 w-9 p-0", 
    lg: "h-10 w-10 p-0"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        sizeClasses[size],
        "rounded-full bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-200",
        className
      )}
      onClick={handleClick}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-colors duration-200",
          favorite 
            ? "fill-red-500 text-red-500" 
            : "text-gray-600 hover:text-red-500"
        )} 
      />
    </Button>
  );
};