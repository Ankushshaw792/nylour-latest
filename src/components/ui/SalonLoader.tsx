import { cn } from "@/lib/utils";

interface SalonLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-16 h-16", text: "text-xs" },
  md: { container: "w-24 h-24", text: "text-sm" },
  lg: { container: "w-36 h-36", text: "text-base" },
};

const SalonLoader = ({ size = "md", text, className }: SalonLoaderProps) => {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative", sizes.container)}>
        <svg
          viewBox="0 0 120 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic gradient for scissors */}
            <linearGradient id="scissorsMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8E8E8" />
              <stop offset="25%" stopColor="#A0A0A0" />
              <stop offset="50%" stopColor="#D4D4D4" />
              <stop offset="75%" stopColor="#888888" />
              <stop offset="100%" stopColor="#B0B0B0" />
            </linearGradient>
            
            {/* Hair gradient */}
            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
            </linearGradient>

            {/* Skin tone gradient */}
            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Realistic Head Profile - Side View */}
          <g>
            {/* Neck */}
            <path
              d="M 28 72 
                 Q 30 78, 26 85
                 L 22 85
                 Q 24 78, 25 72"
              fill="url(#skinGradient)"
            />
            
            {/* Head shape - realistic profile */}
            <path
              d="M 15 50
                 Q 12 35, 20 22
                 Q 28 10, 42 12
                 Q 52 14, 52 28
                 Q 52 38, 48 48
                 Q 46 52, 42 56
                 L 38 58
                 Q 34 60, 32 62
                 Q 28 66, 28 72
                 Q 26 72, 24 70
                 Q 20 65, 18 58
                 Q 14 52, 15 50"
              fill="url(#skinGradient)"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
            
            {/* Ear */}
            <ellipse
              cx="18"
              cy="48"
              rx="3"
              ry="5"
              fill="url(#skinGradient)"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="0.3"
              strokeOpacity="0.2"
            />
            
            {/* Eye hint */}
            <ellipse
              cx="36"
              cy="38"
              rx="2.5"
              ry="1.5"
              fill="hsl(var(--muted-foreground))"
              fillOpacity="0.4"
            />
            
            {/* Eyebrow */}
            <path
              d="M 32 34 Q 36 32, 41 34"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeOpacity="0.5"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Nose */}
            <path
              d="M 42 40 Q 46 46, 44 52 Q 42 54, 40 53"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="0.8"
              strokeOpacity="0.4"
              fill="none"
            />
            
            {/* Lips hint */}
            <path
              d="M 36 60 Q 40 59, 42 60"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="0.8"
              strokeOpacity="0.4"
              fill="none"
            />
          </g>

          {/* Long Flowing Hair */}
          <g className="animate-hair-sway" style={{ transformOrigin: "35px 20px" }}>
            {/* Hair volume on head */}
            <path
              d="M 18 22
                 Q 22 8, 40 8
                 Q 55 8, 58 18
                 Q 60 25, 58 35
                 Q 56 32, 52 28
                 Q 50 14, 40 14
                 Q 28 14, 22 24
                 Q 20 28, 18 22"
              fill="hsl(var(--foreground))"
              fillOpacity="0.8"
            />
            
            {/* Flowing hair strands - multiple layers */}
            <path
              d="M 52 22 Q 70 18, 88 24 Q 100 28, 105 35"
              stroke="url(#hairGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 54 28 Q 72 26, 90 34 Q 102 40, 108 48"
              stroke="url(#hairGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 52 35 Q 68 34, 85 42 Q 98 50, 105 60"
              stroke="url(#hairGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 48 42 Q 65 44, 82 52 Q 94 60, 100 70"
              stroke="url(#hairGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 45 50 Q 60 54, 76 62 Q 88 70, 94 80"
              stroke="url(#hairGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 42 58 Q 55 64, 70 72 Q 80 80, 85 88"
              stroke="url(#hairGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Realistic Scissors */}
          <g style={{ transformOrigin: "82px 45px" }}>
            {/* Top Blade */}
            <g className="animate-scissor-cut" style={{ transformOrigin: "82px 45px" }}>
              <path
                d="M 82 45 
                   L 98 28
                   Q 100 26, 102 27
                   L 103 29
                   Q 102 31, 100 32
                   L 84 46"
                fill="url(#scissorsMetal)"
                stroke="#666"
                strokeWidth="0.5"
              />
              {/* Top finger ring */}
              <ellipse
                cx="105"
                cy="24"
                rx="6"
                ry="5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                transform="rotate(-50 105 24)"
              />
              {/* Inner ring hole */}
              <ellipse
                cx="105"
                cy="24"
                rx="3.5"
                ry="2.8"
                fill="hsl(var(--background))"
                transform="rotate(-50 105 24)"
              />
            </g>
            
            {/* Bottom Blade */}
            <g className="animate-scissor-cut-reverse" style={{ transformOrigin: "82px 45px" }}>
              <path
                d="M 82 45 
                   L 98 60
                   Q 100 62, 102 61
                   L 103 59
                   Q 102 57, 100 56
                   L 84 44"
                fill="url(#scissorsMetal)"
                stroke="#666"
                strokeWidth="0.5"
              />
              {/* Bottom finger ring */}
              <ellipse
                cx="105"
                cy="64"
                rx="6"
                ry="5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                transform="rotate(50 105 64)"
              />
              {/* Inner ring hole */}
              <ellipse
                cx="105"
                cy="64"
                rx="3.5"
                ry="2.8"
                fill="hsl(var(--background))"
                transform="rotate(50 105 64)"
              />
            </g>
            
            {/* Pivot screw */}
            <circle
              cx="82"
              cy="45"
              r="3"
              fill="#888"
              stroke="#666"
              strokeWidth="0.5"
            />
            <circle
              cx="82"
              cy="45"
              r="1.5"
              fill="#AAA"
            />
          </g>

          {/* Falling hair clippings */}
          <g>
            <path
              d="M 88 52 Q 90 54, 89 58"
              className="stroke-foreground/50 animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0s" }}
            />
            <path
              d="M 92 56 Q 95 60, 93 66"
              className="stroke-foreground/40 animate-hair-fall"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.4s" }}
            />
            <path
              d="M 85 58 Q 86 62, 84 68"
              className="stroke-foreground/45 animate-hair-fall"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.8s" }}
            />
          </g>
        </svg>
      </div>
      {text && (
        <p className={cn("text-muted-foreground animate-pulse", sizes.text)}>
          {text}
        </p>
      )}
    </div>
  );
};

export { SalonLoader };
