"use client";

import { useState } from "react";

function getDomain(website) {
  if (!website) return "";
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();
}

function getGradient(name = "") {
  const colors = [
    ["#3b82f6", "#1d4ed8"], // Blue
    ["#10b981", "#047857"], // Emerald
    ["#8b5cf6", "#6d28d9"], // Purple
    ["#f59e0b", "#b45309"], // Amber
    ["#ec4899", "#be185d"], // Pink
    ["#06b6d4", "#0e7490"], // Cyan
    ["#f97316", "#c2410c"], // Orange
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

export default function CompanyLogo({ website, name = "", size = 48, className = "" }) {
  const domain = getDomain(website);
  const [sourceIndex, setSourceIndex] = useState(0); // 0: Google v2 Favicon (128px), 1: DuckDuckGo ICO, 2: Fallback
  const [hasError, setHasError] = useState(false);

  const sources = domain
    ? [
        `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      ]
    : [];

  const [c1, c2] = getGradient(name);

  function handleError() {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((idx) => idx + 1);
    } else {
      setHasError(true);
    }
  }

  if (!domain || hasError || sources.length === 0) {
    return (
      <div
        className={`company-fallback-avatar ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: Math.round(size * 0.22),
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: Math.round(size * 0.44),
          userSelect: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {name ? name.charAt(0).toUpperCase() : "S"}
      </div>
    );
  }

  return (
    <div
      className={`company-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: Math.round(size * 0.22),
        background: "#ffffff",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        padding: Math.round(size * 0.12),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[sourceIndex]}
        alt={`${name} logo`}
        width={size}
        height={size}
        onError={handleError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: Math.round(size * 0.1),
        }}
        loading="lazy"
      />
    </div>
  );
}
