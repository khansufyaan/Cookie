import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Visa Wallet Rating — The credit rating for wallets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7f9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 28,
              border: "6px solid #067647",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 0",
              boxShadow: "0 12px 40px -12px rgba(16,24,40,0.25)",
            }}
          >
            <div style={{ fontSize: 16, letterSpacing: 6, color: "#667085", fontWeight: 600 }}>VISA</div>
            <div style={{ fontSize: 96, fontWeight: 700, color: "#067647", lineHeight: 1 }}>A</div>
            <div style={{ fontSize: 16, letterSpacing: 6, color: "#667085", fontWeight: 600 }}>RATED</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: "#101828", lineHeight: 1.1 }}>
              The credit rating
            </div>
            <div style={{ fontSize: 72, fontWeight: 700, color: "#101828", lineHeight: 1.1 }}>for wallets.</div>
            <div style={{ marginTop: 24, fontSize: 28, color: "#475467" }}>
              Visa Wallet Rating · live on-chain ratings
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
