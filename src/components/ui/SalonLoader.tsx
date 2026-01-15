import { cn } from "@/lib/utils";
import loaderCharacter from "@/assets/loader-character.png";

interface SalonLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-20 h-20", image: "w-12 h-12", text: "text-xs" },
  md: { container: "w-28 h-28", image: "w-16 h-16", text: "text-sm" },
  lg: { container: "w-40 h-40", image: "w-24 h-24", text: "text-base" },
};

const SalonLoader = ({ size = "md", text, className }: SalonLoaderProps) => {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative", sizes.container)}>
        {/* Character head image - positioned to the right */}
        <img
          src={loaderCharacter}
          alt="Loading"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 object-contain right-0",
            sizes.image
          )}
        />
        
        {/* Scissors overlay - positioned on left to cut the hair */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
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
          </defs>

          {/* Scissors - positioned on left side to cut hair */}
          <g style={{ transformOrigin: "32px 45px" }}>
            {/* Top Blade */}
            <g className="animate-scissor-cut" style={{ transformOrigin: "32px 45px" }}>
              <path
                d="M 32 45 
                   L 16 28
                   Q 14 26, 12 27
                   L 11 29
                   Q 12 31, 14 32
                   L 30 46"
                fill="url(#scissorsMetal)"
                stroke="#555"
                strokeWidth="0.8"
              />
              {/* Top finger ring */}
              <ellipse
                cx="9"
                cy="24"
                rx="5"
                ry="4"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                transform="rotate(50 9 24)"
              />
              {/* Inner ring hole */}
              <ellipse
                cx="9"
                cy="24"
                rx="2.8"
                ry="2.2"
                fill="hsl(var(--background))"
                transform="rotate(50 9 24)"
              />
            </g>
            
            {/* Bottom Blade */}
            <g className="animate-scissor-cut-reverse" style={{ transformOrigin: "32px 45px" }}>
              <path
                d="M 32 45 
                   L 16 60
                   Q 14 62, 12 61
                   L 11 59
                   Q 12 57, 14 56
                   L 30 44"
                fill="url(#scissorsMetal)"
                stroke="#555"
                strokeWidth="0.8"
              />
              {/* Bottom finger ring */}
              <ellipse
                cx="9"
                cy="64"
                rx="5"
                ry="4"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                transform="rotate(-50 9 64)"
              />
              {/* Inner ring hole */}
              <ellipse
                cx="9"
                cy="64"
                rx="2.8"
                ry="2.2"
                fill="hsl(var(--background))"
                transform="rotate(-50 9 64)"
              />
            </g>
            
            {/* Pivot screw */}
            <circle
              cx="32"
              cy="45"
              r="2.5"
              fill="#888"
              stroke="#555"
              strokeWidth="0.5"
            />
            <circle
              cx="32"
              cy="45"
              r="1.2"
              fill="#BBB"
            />
          </g>

          {/* Falling hair clippings - originating from scissors cut point */}
          <g>
            <path
              d="M 34 48 Q 38 58, 35 72"
              className="stroke-foreground/50 animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0s" }}
            />
            <path
              d="M 30 50 Q 32 62, 28 78"
              className="stroke-foreground/40 animate-hair-fall"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.4s" }}
            />
            <path
              d="M 38 52 Q 42 65, 40 82"
              className="stroke-foreground/45 animate-hair-fall"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.8s" }}
            />
            <path
              d="M 26 54 Q 28 68, 24 85"
              className="stroke-foreground/35 animate-hair-fall"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "1.2s" }}
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
