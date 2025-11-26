
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
      <defs>
        <style>{`
          .synterra-pulse-primary { animation: synterraPulse 2.8s ease-in-out infinite; }
          .synterra-pulse-secondary { animation: synterraPulse 3.4s ease-in-out infinite; animation-delay: .25s; }
          .synterra-pulse-tertiary { animation: synterraPulse 3s ease-in-out infinite; animation-delay: .5s; }
          .synterra-dot { animation: synterraDot 4s ease-in-out infinite; transform-origin: center; }
          @keyframes synterraPulse {
            0%, 100% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(-0.6px); opacity: .9; }
          }
          @keyframes synterraDot {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.12); }
          }
        `}</style>
      </defs>
      {/* Icon S */}
      <g transform="translate(10,10)">
        {/* "terra" arcs */}
        <path d="M4 2 A22 22 0 0 1 36 14" fill="none" stroke="#06B6D4" strokeWidth="2" />
        <path d="M4 40 A22 22 0 0 0 36 28" fill="none" stroke="#06B6D4" strokeWidth="2" />
        {/* Top bar */}
        <rect x="4" y="4" width="28" height="6" rx="3" fill="#06B6D4" className="synterra-pulse-primary" />
        {/* Active segment in top bar */}
        <rect x="22" y="4" width="10" height="6" rx="3" fill="#A3E635" className="synterra-pulse-secondary" />
        <circle cx="32" cy="7" r="1.6" fill="#111827" className="synterra-dot" />
        {/* Middle bar */}
        <rect x="10" y="18" width="28" height="6" rx="3" fill="#06B6D4" className="synterra-pulse-secondary" />
        {/* Two segments/logs in the middle */}
        <rect x="10" y="18" width="9" height="6" rx="3" fill="#A3E635" className="synterra-pulse-tertiary" />
        <circle cx="14.5" cy="21" r="1.6" fill="#111827" className="synterra-dot" />
        {/* Bottom bar */}
        <rect x="4" y="32" width="28" height="6" rx="3" fill="#06B6D4" className="synterra-pulse-primary" />
        {/* Active start (e.g., first order stage) */}
        <rect x="4" y="32" width="10" height="6" rx="3" fill="#A3E635" className="synterra-pulse-tertiary" />
      </g>
      {/* Text "Synterra" */}
      <text
        x="65"
        y="37"
        fontFamily="-apple-system, system-ui, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Arial, sans-serif"
        fontSize="24"
        fontWeight="600"
        fill="currentColor"
      >
        Synterra
      </text>
    </svg>
  );
}