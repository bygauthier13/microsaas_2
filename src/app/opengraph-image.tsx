import { ImageResponse } from "next/og";

export const alt = "Ensign — the AML file for every superyacht deal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b1b2b", padding: 72, color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#12395b" />
            <path d="M10 7.5v17" stroke="#d9c49a" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M11 8.5h11.5l-2.6 4 2.6 4H11z" fill="#d9c49a" />
          </svg>
          <span style={{ fontSize: 44, fontFamily: "serif" }}>Ensign</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 76, lineHeight: 1.04, fontFamily: "serif", maxWidth: 980 }}>The AML file for every superyacht deal.</span>
          <span style={{ fontSize: 30, color: "#d9c49a" }}>EU AMLR · Article 74 · Monaco · France — from 10 July 2027</span>
        </div>
        <span style={{ fontSize: 24, color: "rgba(255,255,255,0.6)" }}>Client KYC link · sanctions & PEP screening · risk scoring · approvals · threshold reports</span>
      </div>
    ),
    size,
  );
}
