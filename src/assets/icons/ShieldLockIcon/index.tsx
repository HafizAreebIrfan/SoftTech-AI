import React from "react";
import { IconProps } from "../../../types/icontypes";

const ShieldLockIcon: React.FC<IconProps> = ({ size = 16, color = "currentColor" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
    </svg>
  );
};

export default ShieldLockIcon;
