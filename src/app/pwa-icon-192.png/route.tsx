import { ImageResponse } from "next/og";
import { PwaAppIcon } from "@/components/pwa/PwaAppIcon";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<PwaAppIcon size={192} />, {
    width: 192,
    height: 192,
  });
}
