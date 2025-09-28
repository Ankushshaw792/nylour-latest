import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Users, Timer } from 'lucide-react';
import { useQueueTimer } from '@/hooks/useQueueTimer';

interface QueueTimerProps {
  salonId: string;
  customerId: string;
  className?: string;
}

const QueueTimer: React.FC<QueueTimerProps> = ({ salonId, customerId, className = '' }) => {
  const {
    estimatedWaitMinutes,
    queuePosition,
    actualWaitTime,
    timeRemaining,
    isLoading,
    formatTime,
    getStatusMessage,
    getStatusColor
  } = useQueueTimer(salonId, customerId);

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Status Message */}
        <div className={`text-center font-semibold text-lg ${getStatusColor()}`}>
          {getStatusMessage()}
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Timer className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {formatTime(timeRemaining)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">estimated wait time</p>
        </div>

        {/* Queue Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">{queuePosition}</span>
            </div>
            <p className="text-xs text-muted-foreground">position in queue</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">{formatTime(actualWaitTime)}</span>
            </div>
            <p className="text-xs text-muted-foreground">actual wait time</p>
          </div>
        </div>

        {/* Progress Bar */}
        {estimatedWaitMinutes > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started</span>
              <span>Ready</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (actualWaitTime / estimatedWaitMinutes) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QueueTimer;