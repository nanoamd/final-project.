import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Same lettermark as icon.tsx, at Apple's recommended touch-icon size. */
export default function AppleIcon() {
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
        fontSize: 110,
        fontWeight: 700,
      }}
    >
      K
    </div>,
    { ...size },
  );
}
