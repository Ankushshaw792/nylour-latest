import { cn } from "@/lib/utils";

interface SalonLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-24 h-24", text: "text-xs" },
  md: { container: "w-32 h-32", text: "text-sm" },
  lg: { container: "w-44 h-44", text: "text-base" },
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
            {/* Skin gradient */}
            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C4A0" />
              <stop offset="50%" stopColor="#D4A574" />
              <stop offset="100%" stopColor="#C4956A" />
            </linearGradient>
            
            {/* Hair gradient */}
            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3D2914" />
              <stop offset="50%" stopColor="#2D1810" />
              <stop offset="100%" stopColor="#1A0F0A" />
            </linearGradient>
            
            {/* Hair highlight gradient */}
            <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5A3D2B" />
              <stop offset="100%" stopColor="#2D1810" />
            </linearGradient>
            
            {/* Metallic gradient for scissors */}
            <linearGradient id="scissorsMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0F0F0" />
              <stop offset="25%" stopColor="#B8B8B8" />
              <stop offset="50%" stopColor="#E0E0E0" />
              <stop offset="75%" stopColor="#A0A0A0" />
              <stop offset="100%" stopColor="#C8C8C8" />
            </linearGradient>

            {/* Shadow filter */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Character Group - positioned on the right */}
          <g transform="translate(45, 8)" filter="url(#shadow)">
            {/* Neck */}
            <path
              d="M 35 65 
                 Q 38 72, 40 82
                 L 48 82
                 Q 46 72, 44 65"
              fill="url(#skinGradient)"
            />
            
            {/* Ear */}
            <ellipse
              cx="52"
              cy="48"
              rx="4"
              ry="6"
              fill="url(#skinGradient)"
              stroke="#C4956A"
              strokeWidth="0.5"
            />
            <path
              d="M 50 46 Q 52 48, 50 50"
              fill="none"
              stroke="#B8865A"
              strokeWidth="0.8"
            />
            
            {/* Face - Side Profile */}
            <path
              d="M 48 20
                 Q 55 18, 55 25
                 L 55 35
                 Q 56 40, 52 45
                 L 50 48
                 Q 48 52, 50 55
                 L 48 58
                 Q 44 62, 40 64
                 Q 35 66, 32 64
                 L 30 60
                 Q 28 55, 28 48
                 Q 28 35, 32 25
                 Q 36 18, 48 20"
              fill="url(#skinGradient)"
            />
            
            {/* Eyebrow */}
            <path
              d="M 42 32 Q 46 30, 50 32"
              fill="none"
              stroke="#2D1810"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            
            {/* Eye */}
            <ellipse
              cx="46"
              cy="38"
              rx="2.5"
              ry="3"
              fill="#1A0F0A"
            />
            <circle cx="45.5" cy="37.5" r="0.8" fill="#FFF" />
            
            {/* Eyelashes */}
            <path
              d="M 43 36 Q 42 34, 41 33"
              fill="none"
              stroke="#1A0F0A"
              strokeWidth="0.5"
            />
            
            {/* Nose line */}
            <path
              d="M 50 40 Q 52 44, 50 48"
              fill="none"
              stroke="#B8865A"
              strokeWidth="0.8"
            />
            
            {/* Lips */}
            <path
              d="M 42 56 Q 46 55, 48 56"
              fill="#C4736A"
              stroke="#B8636A"
              strokeWidth="0.5"
            />
            <path
              d="M 42 56 Q 46 58, 48 56"
              fill="#D4837A"
            />
            
            {/* Hair - Back layer (voluminous) */}
            <path
              d="M 25 15
                 Q 15 10, 5 15
                 Q -5 20, 0 35
                 Q 3 45, 8 50
                 Q 12 55, 15 50
                 Q 18 42, 22 35
                 Q 25 30, 28 28
                 Q 28 22, 25 15"
              fill="url(#hairGradient)"
              className="animate-hair-sway"
              style={{ transformOrigin: "25px 35px" }}
            />
            
            {/* Hair - Middle layer with texture */}
            <path
              d="M 30 12
                 Q 20 8, 10 12
                 Q 2 18, 5 30
                 Q 8 40, 12 45
                 Q 16 48, 20 42
                 Q 24 35, 28 30
                 Q 32 24, 30 12"
              fill="url(#hairHighlight)"
              className="animate-hair-sway"
              style={{ transformOrigin: "20px 30px", animationDelay: "0.1s" }}
            />
            
            {/* Hair - Top layer (main volume) */}
            <path
              d="M 48 18
                 Q 45 10, 35 8
                 Q 25 6, 15 10
                 Q 8 14, 10 25
                 Q 12 32, 18 38
                 Q 22 42, 26 38
                 Q 30 32, 32 26
                 Q 34 20, 40 18
                 Q 45 16, 48 18"
              fill="url(#hairGradient)"
            />
            
            {/* Hair strands for texture */}
            <path
              d="M 35 10 Q 30 8, 25 12"
              fill="none"
              stroke="#1A0F0A"
              strokeWidth="1"
              opacity="0.5"
            />
            <path
              d="M 28 12 Q 22 10, 18 15"
              fill="none"
              stroke="#1A0F0A"
              strokeWidth="0.8"
              opacity="0.4"
            />
            <path
              d="M 20 15 Q 14 14, 10 20"
              fill="none"
              stroke="#1A0F0A"
              strokeWidth="0.8"
              opacity="0.4"
            />
            
            {/* Hair being cut - strands at the cut point */}
            <g className="animate-hair-sway" style={{ transformOrigin: "5px 35px" }}>
              <path
                d="M 8 35 Q 4 38, 0 42"
                fill="none"
                stroke="#2D1810"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 10 40 Q 5 44, 0 48"
                fill="none"
                stroke="#3D2914"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 6 32 Q 2 34, -2 38"
                fill="none"
                stroke="#2D1810"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* Scissors - positioned on left to cut hair */}
          <g style={{ transformOrigin: "42px 48px" }}>
            {/* Top Blade */}
            <g className="animate-scissor-cut" style={{ transformOrigin: "42px 48px" }}>
              <path
                d="M 42 48 
                   L 22 28
                   Q 19 25, 16 26
                   L 14 29
                   Q 16 32, 19 33
                   L 40 50"
                fill="url(#scissorsMetal)"
                stroke="#666"
                strokeWidth="0.8"
              />
              {/* Top finger ring */}
              <ellipse
                cx="12"
                cy="22"
                rx="6"
                ry="5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                transform="rotate(50 12 22)"
              />
              <ellipse
                cx="12"
                cy="22"
                rx="3.5"
                ry="2.8"
                fill="hsl(var(--background))"
                transform="rotate(50 12 22)"
              />
            </g>
            
            {/* Bottom Blade */}
            <g className="animate-scissor-cut-reverse" style={{ transformOrigin: "42px 48px" }}>
              <path
                d="M 42 48 
                   L 22 66
                   Q 19 69, 16 68
                   L 14 65
                   Q 16 62, 19 61
                   L 40 46"
                fill="url(#scissorsMetal)"
                stroke="#666"
                strokeWidth="0.8"
              />
              {/* Bottom finger ring */}
              <ellipse
                cx="12"
                cy="72"
                rx="6"
                ry="5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                transform="rotate(-50 12 72)"
              />
              <ellipse
                cx="12"
                cy="72"
                rx="3.5"
                ry="2.8"
                fill="hsl(var(--background))"
                transform="rotate(-50 12 72)"
              />
            </g>
            
            {/* Pivot screw */}
            <circle
              cx="42"
              cy="48"
              r="3"
              fill="#888"
              stroke="#555"
              strokeWidth="0.5"
            />
            <circle
              cx="42"
              cy="48"
              r="1.5"
              fill="#CCC"
            />
          </g>

          {/* Falling hair clippings */}
          <g>
            <path
              d="M 48 52 Q 52 65, 48 82"
              className="stroke-[#2D1810] animate-hair-fall"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0s" }}
            />
            <path
              d="M 44 55 Q 46 70, 42 88"
              className="stroke-[#3D2914] animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.3s" }}
            />
            <path
              d="M 52 50 Q 58 68, 55 90"
              className="stroke-[#2D1810] animate-hair-fall"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.6s" }}
            />
            <path
              d="M 40 58 Q 42 75, 38 92"
              className="stroke-[#1A0F0A] animate-hair-fall"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: "0.9s" }}
            />
            <path
              d="M 56 54 Q 60 72, 58 88"
              className="stroke-[#3D2914] animate-hair-fall"
              strokeWidth="1.4"
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
