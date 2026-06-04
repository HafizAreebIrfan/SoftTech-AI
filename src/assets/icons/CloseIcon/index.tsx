import React, { FC } from "react";
import { IconProps } from "../../../types/icontypes";

const CloseIcon: FC<IconProps> = ({ size, color }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 17L16.8995 7.10051"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 7.00001L16.8995 16.8995"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CloseIcon;
