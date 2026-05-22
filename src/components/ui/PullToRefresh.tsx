import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  disabled = false,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStatus, setPullStatus] = useState<"idle" | "pulling" | "ready" | "refreshing">("idle");
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 130;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled || isRefreshing) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if we are scrolled to the absolute top of the page
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop <= 1) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
        setPullStatus("idle");
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      // Only handle downward swipe
      if (diff > 0) {
        // Logarithmic/resistance formula so the pull action feels realistic and elastic
        const distance = Math.min(MAX_PULL, diff * 0.45);
        setPullDistance(distance);

        if (distance >= PULL_THRESHOLD) {
          setPullStatus("ready");
        } else {
          setPullStatus("pulling");
        }

        // Prevent browser default pull-to-refresh action
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        isPulling.current = false;
        setPullDistance(0);
        setPullStatus("idle");
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setPullStatus("refreshing");
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default reload behavior: Wait a moment for UX, then reload the page
            await new Promise((resolve) => setTimeout(resolve, 800));
            window.location.reload();
          }
        } catch (error) {
          console.error("Refresh action failed:", error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setPullStatus("idle");
        }
      } else {
        // Springs back gracefully
        setPullDistance(0);
        setPullStatus("idle");
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  // Dynamic CSS translation for the main content
  const contentStyle = {
    transform: `translateY(${pullDistance}px)`,
    transition: isPulling.current ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  };

  // Spinner rotation mapping
  const rotation = Math.min(360, (pullDistance / PULL_THRESHOLD) * 360);

  return (
    <div ref={containerRef} className="relative w-full min-h-full">
      {/* Pull down indicator overlay */}
      <div 
        className={cn(
          "absolute left-0 right-0 z-[40] flex justify-center items-center pointer-events-none transition-opacity duration-200",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: `${pullDistance - 45}px`,
          transform: `scale(${Math.min(1.1, Math.max(0.5, pullDistance / PULL_THRESHOLD))})`,
          transition: isPulling.current ? "none" : "top 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/50 dark:border-zinc-800/50 shadow-md backdrop-blur-sm p-2 rounded-full flex items-center justify-center">
          {pullStatus === "refreshing" || isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Loader2 
              className={cn(
                "h-5 w-5 text-primary transition-transform duration-75",
                pullStatus === "ready" && "scale-110 text-emerald-500"
              )} 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                opacity: Math.max(0.4, pullDistance / PULL_THRESHOLD)
              }} 
            />
          )}
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div style={contentStyle} className="w-full min-h-full">
        {children}
      </div>
    </div>
  );
};
