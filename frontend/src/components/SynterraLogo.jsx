import React from 'react';

export default function SynterraLogo({ className }) {
  return (
    <svg
      className={className}
      width="260"
      height="60"
      viewBox="0 0 260 60"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="synterra-logo-title"
    >
      <title id="synterra-logo-title">Synterra – timesheets, magazyn, zamówienia i klienci</title>
      {/* Icon S */}
      <g transform="translate(10,10)">
        {/* "terra" arcs */}
        <path d="M4 2 A22 22 0 0 1 36 14" fill="none" stroke="#06B6D4" strokeWidth="2" />
        <path d="M4 40 A22 22 0 0 0 36 28" fill="none" stroke="#06B6D4" strokeWidth="2" />
        {/* Top bar */}
        <rect x="4" y="4" width="28" height="6" rx="3" fill="#06B6D4" />
        {/* Active segment in top bar */}
        <rect x="22" y="4" width="10" height="6" rx="3" fill="#A3E635" />
        <circle cx="32" cy="7" r="1.6" fill="#111827" />
        {/* Middle bar */}
        <rect x="10" y="18" width="28" height="6" rx="3" fill="#06B6D4" />
        {/* Two segments/logs in the middle */}
        <rect x="10" y="18" width="9" height="6" rx="3" fill="#A3E635" />
        <circle cx="14.5" cy="21" r="1.6" fill="#111827" />
        {/* Bottom bar */}
        <rect x="4" y="32" width="28" height="6" rx="3" fill="#06B6D4" />
        {/* Active start (e.g., first order stage) */}
        <rect x="4" y="32" width="10" height="6" rx="3" fill="#A3E635" />
      </g>
      {/* Text "Synterra" */}
      <text
        x="65"
        y="37"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
      >
        Synterra
      </text>
    </svg>
  );
}