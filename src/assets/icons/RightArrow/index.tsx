import React, { FC } from "react";
import { IconProps } from "../../../types/icontypes";

const RightArrowIcon: FC<IconProps> = ({ size, color }) => {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
};

export default RightArrowIcon;
