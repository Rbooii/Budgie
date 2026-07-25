import { ImageResponse } from "next/og";

export const alt = "Budgie — Track your money in calm focus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "24px",
              background: "#00C610",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "44px",
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ fontSize: "40px", fontWeight: 700, color: "#171717" }}>Budgie</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "76px",
              fontWeight: 700,
              color: "#171717",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            <div>Your money,</div>
            <div>in calm focus.</div>
          </div>
          <div style={{ fontSize: "28px", color: "#525252" }}>
            Track accounts, budgets &amp; subscriptions — built around the rupiah.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "#00C610",
              color: "#FFFFFF",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Free forever
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "#F2F2F2",
              color: "#171717",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Plus from Rp 24.500/mo
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}