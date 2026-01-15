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
        {/* Character head image */}
        <img
          src={loaderCharacter}
          alt="Loading"
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain",
            sizes.image
          )}
        />
        
        {/* Scissors overlay */}
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

          {/* Realistic Scissors - positioned to the right of the head */}
          <g style={{ transformOrigin: "72px 50px" }}>
            {/* Top Blade */}
            <g className="animate-scissor-cut" style={{ transformOrigin: "72px 50px" }}>
              <path
                d="M 72 50 
                   L 88 33
                   Q 90 31, 92 32
                   L 93 34
                   Q 92 36, 90 37
                   L 74 51"
                fill="url(#scissorsMetal)"
                stroke="#555"
                strokeWidth="0.8"
              />
              {/* Top finger ring */}
              <ellipse
                cx="95"
                cy="29"
                rx="5"
                ry="4"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                transform="rotate(-50 95 29)"
              />
              {/* Inner ring hole */}
              <ellipse
                cx="95"
                cy="29"
                rx="2.8"
                ry="2.2"
                fill="hsl(var(--background))"
                transform="rotate(-50 95 29)"
              />
            </g>
            
            {/* Bottom Blade */}
            <g className="animate-scissor-cut-reverse" style={{ transformOrigin: "72px 50px" }}>
              <path
                d="M 72 50 
                   L 88 65
                   Q 90 67, 92 66
                   L 93 64
                   Q 92 62, 90 61
                   L 74 49"
                fill="url(#scissorsMetal)"
                stroke="#555"
                strokeWidth="0.8"
              />
              {/* Bottom finger ring */}
              <ellipse
                cx="95"
                cy="69"
                rx="5"
                ry="4"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                transform="rotate(50 95 69)"
              />
              {/* Inner ring hole */}
              <ellipse
                cx="95"
                cy="69"
                rx="2.8"
                ry="2.2"
                fill="hsl(var(--background))"
                transform="rotate(50 95 69)"
              />
            </g>
            
            {/* Pivot screw */}
            <circle
              cx="72"
              cy="50"
              r="2.5"
              fill="#888"
              stroke="#555"
              strokeWidth="0.5"
            />
            <circle
              cx="72"
              cy="50"
              r="1.2"
              fill="#BBB"
            />
          </g>

          {/* Falling hair clippings */}
          <g>
            <path
              d="M 68 55 Q 70 60, 68 68"
              className="stroke-foreground/50 animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0s" }}
            />
            <path
              d="M 74 58 Q 77 65, 74 75"
              className="stroke-foreground/40 animate-hair-fall"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.4s" }}
            />
            <path
              d="M 62 60 Q 63 67, 60 78"
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
