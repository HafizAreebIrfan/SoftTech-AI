import React from "react";
import { IconProps } from "../../../types/icontypes";

const DevicesIcon: React.FC<IconProps> = ({ size = 18, color = "currentColor" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="12" x="2" y="3" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <rect width="6" height="10" x="16" y="11" rx="1" />
    </svg>
  );
};

export default DevicesIcon;
