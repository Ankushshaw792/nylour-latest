import { Button } from "@/components/ui/button";

interface FixedBottomButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  price?: number;
  itemCount?: number;
  variant?: "default" | "gradient" | "outline" | "ghost" | "success";
  className?: string;
}

export const FixedBottomButton = ({
  text,
  onClick,
  disabled = false,
  price,
  itemCount,
  variant = "gradient",
  className = ""
}: FixedBottomButtonProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border p-4">
      <Button
        variant={variant}
        size="xl"
        className={`w-full relative ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {text}
        {itemCount && itemCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
            {itemCount}
          </div>
        )}
        {price && price > 0 && (
          <span className="ml-2">• ₹{price}</span>
        )}
      </Button>
    </div>
  );
};