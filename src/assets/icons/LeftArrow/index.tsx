import React, { FC } from "react";
import { IconProps } from "../../../types/icontypes";

const LeftArrowIcon: FC<IconProps> = ({ size, color }) => {
  return <svg width={size} height={size} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M768 903.232l-50.432 56.768L256 512l461.568-448 50.432 56.768L364.928 512z" fill={color} /></svg>
};

export default LeftArrowIcon;
