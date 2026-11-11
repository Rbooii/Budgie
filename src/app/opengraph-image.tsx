import { ImageResponse } from "next/og";

export const alt = "Budgie, a clearer way to see your money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const logo = `${siteUrl}/android-chrome-192x192.png`;

const PAPER = "#FAF9F5";
const INK = "#141413";
const MUTED = "#5E5D59";
const HAIRLINE = "#DEDCD1";
const GREEN = "#5ABB37";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PAPER,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src={logo}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: "8px" }}
          />
          <div
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: INK,
            }}
          >
            Budgie
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "88px",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              color: INK,
              maxWidth: "900px",
            }}
          >
            Money, made clearer.
          </div>
          <div
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "24px",
              lineHeight: 1.5,
              color: MUTED,
              maxWidth: "760px",
            }}
          >
            See your balance, plan your savings, and learn where your spending
            goes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: "24px",
            fontFamily: "Arial, sans-serif",
            fontSize: "17px",
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", gap: "28px" }}>
            <span>Balance</span>
            <span>Budgets</span>
            <span>Savings</span>
          </div>
          <span style={{ color: GREEN }}>Free to use</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
