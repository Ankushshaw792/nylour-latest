import { cn } from "@/lib/utils";

interface SalonLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-12 h-12", text: "text-xs" },
  md: { container: "w-20 h-20", text: "text-sm" },
  lg: { container: "w-32 h-32", text: "text-base" },
};

const SalonLoader = ({ size = "md", text, className }: SalonLoaderProps) => {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative", sizes.container)}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head silhouette */}
          <ellipse
            cx="40"
            cy="50"
            rx="18"
            ry="22"
            className="fill-muted-foreground/20"
          />
          
          {/* Face profile hint */}
          <ellipse
            cx="35"
            cy="48"
            rx="12"
            ry="16"
            className="fill-muted-foreground/30"
          />

          {/* Long flowing hair strands */}
          <g className="animate-hair-sway origin-left">
            <path
              d="M 50 35 Q 70 30, 90 35 Q 95 40, 92 45"
              className="stroke-foreground/60 fill-none"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 50 42 Q 72 38, 88 45 Q 94 52, 90 58"
              className="stroke-foreground/70 fill-none"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 50 50 Q 70 48, 85 55 Q 92 62, 88 68"
              className="stroke-foreground/60 fill-none"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 50 58 Q 68 58, 82 65 Q 88 72, 85 78"
              className="stroke-foreground/50 fill-none"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 48 65 Q 65 68, 78 75 Q 82 80, 80 85"
              className="stroke-foreground/40 fill-none"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Scissors - blade 1 */}
          <g className="animate-scissor-cut" style={{ transformOrigin: "75px 45px" }}>
            <path
              d="M 75 45 L 95 30"
              className="stroke-primary"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="75" cy="45" r="3" className="fill-primary" />
            {/* Handle ring 1 */}
            <ellipse
              cx="97"
              cy="27"
              rx="5"
              ry="4"
              className="stroke-primary fill-none"
              strokeWidth="2"
              transform="rotate(-40 97 27)"
            />
          </g>

          {/* Scissors - blade 2 */}
          <g className="animate-scissor-cut-reverse" style={{ transformOrigin: "75px 45px" }}>
            <path
              d="M 75 45 L 95 55"
              className="stroke-primary"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Handle ring 2 */}
            <ellipse
              cx="97"
              cy="58"
              rx="5"
              ry="4"
              className="stroke-primary fill-none"
              strokeWidth="2"
              transform="rotate(40 97 58)"
            />
          </g>

          {/* Falling hair strands */}
          <g>
            <line
              x1="80"
              y1="50"
              x2="82"
              y2="58"
              className="stroke-foreground/40 animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ animationDelay: "0s" }}
            />
            <line
              x1="85"
              y1="52"
              x2="88"
              y2="62"
              className="stroke-foreground/30 animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ animationDelay: "0.3s" }}
            />
            <line
              x1="78"
              y1="55"
              x2="79"
              y2="65"
              className="stroke-foreground/35 animate-hair-fall"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ animationDelay: "0.6s" }}
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
