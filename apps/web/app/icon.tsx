import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "radial-gradient(circle at 22% 18%, #fff0cf 0%, #ffd6b0 28%, #ff9d6e 62%, #db4a34 100%)",
        }}
      >
        <div
          style={{
            width: 370,
            height: 370,
            borderRadius: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "linear-gradient(145deg, #221f38 0%, #43234e 52%, #6a2e5f 100%)",
            boxShadow: "0 22px 42px rgba(30, 9, 32, 0.35)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 58,
              left: 68,
              width: 78,
              height: 78,
              borderRadius: 999,
              background: "#fff",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 58,
              right: 68,
              width: 78,
              height: 78,
              borderRadius: 999,
              background: "#fff",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 78,
              left: 95,
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#1a1730",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 78,
              right: 95,
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#1a1730",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 96,
              width: 180,
              height: 16,
              borderRadius: 999,
              background: "#f7c4dd",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 54,
              fontSize: 70,
              fontWeight: 800,
              color: "#ffe69e",
              letterSpacing: 1,
            }}
          >
            すき
          </div>
        </div>
      </div>
    ),
    size,
  );
}
