import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FavoritesList } from "@/components/favorites/FavoritesList";

interface FavoritesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FavoritesDialog = ({
  open,
  onOpenChange,
}: FavoritesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Your Favorite Salons</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <FavoritesList />
        </div>
      </DialogContent>
    </Dialog>
  );
};