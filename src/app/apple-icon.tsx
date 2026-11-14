import { ImageResponse } from "next/og";
import { PwaAppIcon } from "@/components/pwa/PwaAppIcon";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<PwaAppIcon size={size.width} />, size);
}
