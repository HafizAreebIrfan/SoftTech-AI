import React, { FC } from "react";
import { IconProps } from "../../../types/icontypes";

const Plus: FC<IconProps> = ({ size, color }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 9 10" fill="none">
      <path
        d="M4.59375 9V1"
        stroke={color}
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 5H0.5"
        stroke={color}
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Plus;
