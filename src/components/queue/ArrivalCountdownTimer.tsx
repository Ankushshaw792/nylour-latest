import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ArrivalCountdownTimerProps {
  arrivalDeadline: string;
  onExpired?: () => void;
  compact?: boolean;
  className?: string;
}

const ArrivalCountdownTimer = ({
  arrivalDeadline,
  onExpired,
  compact = false,
  className
}: ArrivalCountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const deadline = new Date(arrivalDeadline).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [arrivalDeadline, isExpired, onExpired]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const totalTime = 10 * 60; // 10 minutes in seconds
    return Math.min(100, ((totalTime - timeRemaining) / totalTime) * 100);
  };

  const getStatusColor = (): string => {
    if (isExpired) return "text-destructive";
    if (timeRemaining <= 120) return "text-destructive"; // Red under 2 minutes
    if (timeRemaining <= 300) return "text-warning"; // Yellow under 5 minutes
    return "text-success"; // Green otherwise
  };

  const getBackgroundColor = (): string => {
    if (isExpired) return "bg-destructive/10 border-destructive/30";
    if (timeRemaining <= 120) return "bg-destructive/10 border-destructive/30 animate-pulse";
    if (timeRemaining <= 300) return "bg-warning/10 border-warning/30";
    return "bg-success/10 border-success/30";
  };

  const getProgressColor = (): string => {
    if (isExpired) return "bg-destructive";
    if (timeRemaining <= 120) return "bg-destructive";
    if (timeRemaining <= 300) return "bg-warning";
    return "bg-success";
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Clock className={cn("h-4 w-4", getStatusColor())} />
        <span className={cn("font-mono font-semibold text-sm", getStatusColor())}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn("border-2", getBackgroundColor(), className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {timeRemaining <= 120 && !isExpired ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Clock className={cn("h-5 w-5", getStatusColor())} />
            )}
            <span className="font-medium text-sm">
              {isExpired ? "Hurry!" : "Time to Arrive"}
            </span>
          </div>
          <span className={cn("font-mono font-bold text-2xl", getStatusColor())}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        <Progress 
          value={getProgress()} 
          className="h-2"
          style={{
            ['--progress-color' as string]: getProgressColor()
          }}
        />

        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isExpired 
            ? "Reach the salon now!"
            : timeRemaining <= 120 
              ? "⚠️ Hurry! Arrive now"
              : timeRemaining <= 300
                ? "Please head to the salon soon"
                : "Arrive at the salon within this time"
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default ArrivalCountdownTimer;
