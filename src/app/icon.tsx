import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated at request time rather than a static asset — a simple brand
 * lettermark (the burnt-orange brand accent behind a white "K") needs no
 * actual image file to maintain.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#c65a2c",
        color: "#fff",
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      K
    </div>,
    { ...size },
  );
}
