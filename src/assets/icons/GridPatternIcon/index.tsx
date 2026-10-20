import React, { FC } from "react";

interface GridPatternIconProps {
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
}

const GridPatternIcon: FC<GridPatternIconProps> = ({
  className = "absolute inset-0 h-full w-full",
  strokeColor = "white",
  strokeOpacity = 0.1,
}) => {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="grid-pattern-login"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 40V0H40"
            fill="none"
            stroke={strokeColor}
            strokeOpacity={strokeOpacity}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern-login)" />
    </svg>
  );
};

export default GridPatternIcon;
