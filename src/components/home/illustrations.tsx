export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 360"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-hidden="true"
    >
      <rect width="1200" height="360" fill="#e8ecef" />
      <circle cx="1040" cy="70" r="220" fill="#d1dae0" />
      <circle cx="120" cy="330" r="180" fill="#dff0f4" />

      {[90, 210, 330, 450, 570, 690, 810, 930, 1050].map((x, i) => {
        const heights = [150, 190, 130, 210, 170, 150, 200, 140, 180];
        const colors = ["#1b4965", "#62b6cb", "#1b4965", "#5f7f93", "#62b6cb", "#1b4965", "#5f7f93", "#62b6cb", "#1b4965"];
        const h = heights[i];
        const color = colors[i];
        const y = 360 - h;

        return (
          <g key={x}>
            <rect x={x - 22} y={y + 20} width="44" height={h - 20} rx="6" fill={color} opacity="0.92" />
            <rect x={x - 12} y={y} width="24" height="26" rx="4" fill={color} />
            <rect x={x - 8} y={y + 34} width="16" height={Math.max(0, h - 60)} fill="#ffffff" opacity="0.18" />
          </g>
        );
      })}
    </svg>
  );
}

export function DrinksIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <rect width="400" height="320" fill="#e8ecef" />
      <circle cx="330" cy="60" r="110" fill="#d1dae0" />

      <rect x="70" y="150" width="60" height="120" rx="8" fill="#1b4965" />
      <rect x="86" y="126" width="28" height="30" rx="5" fill="#1b4965" />
      <rect x="90" y="182" width="20" height="60" fill="#ffffff" opacity="0.2" />

      <rect x="160" y="110" width="60" height="160" rx="8" fill="#62b6cb" />
      <rect x="176" y="86" width="28" height="30" rx="5" fill="#62b6cb" />
      <rect x="180" y="142" width="20" height="80" fill="#ffffff" opacity="0.22" />

      <rect x="250" y="170" width="60" height="100" rx="8" fill="#5f7f93" />
      <rect x="266" y="146" width="28" height="30" rx="5" fill="#5f7f93" />
      <rect x="270" y="202" width="20" height="50" fill="#ffffff" opacity="0.2" />
    </svg>
  );
}

export function PackagingIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <rect width="400" height="320" fill="#f2f2f2" />
      <circle cx="80" cy="70" r="90" fill="#e8ecef" />

      <rect x="90" y="150" width="110" height="100" rx="6" fill="#d68c45" />
      <path d="M90 150 L145 120 L255 120 L200 150 Z" fill="#e2ae7c" />
      <path d="M200 150 L255 120 L255 220 L200 250 Z" fill="#ab7037" />
      <line x1="90" y1="196" x2="200" y2="196" stroke="#ffffff" strokeWidth="4" opacity="0.4" />

      <rect x="230" y="180" width="80" height="70" rx="6" fill="#1b4965" />
      <path d="M230 180 L266 162 L346 162 L310 180 Z" fill="#5f7f93" />
      <path d="M310 180 L346 162 L346 232 L310 250 Z" fill="#153a50" />
    </svg>
  );
}

export function DeliveryIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <rect width="400" height="320" fill="#dff0f4" />
      <circle cx="330" cy="250" r="120" fill="#eff7f9" />

      <rect x="60" y="150" width="180" height="90" rx="6" fill="#1b4965" />
      <rect x="240" y="180" width="80" height="60" rx="6" fill="#5f7f93" />
      <rect x="255" y="192" width="40" height="26" rx="3" fill="#dff0f4" />

      <circle cx="120" cy="252" r="20" fill="#08151e" />
      <circle cx="120" cy="252" r="8" fill="#dff0f4" />
      <circle cx="270" cy="252" r="20" fill="#08151e" />
      <circle cx="270" cy="252" r="8" fill="#dff0f4" />

      <rect x="80" y="120" width="130" height="10" rx="5" fill="#62b6cb" opacity="0.6" />
    </svg>
  );
}

export function PfandIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <rect width="400" height="400" fill="#e8ecef" />
      <circle cx="90" cy="330" r="130" fill="#d1dae0" />

      <rect x="100" y="140" width="200" height="140" rx="8" fill="#1b4965" />
      <rect x="100" y="140" width="200" height="20" fill="#153a50" />
      {[130, 175, 220, 265].map((x) => (
        <rect key={x} x={x} y="170" width="30" height="90" rx="5" fill="#62b6cb" />
      ))}

      <path
        d="M200 60 a40 40 0 1 1 -0.1 0"
        fill="none"
        stroke="#d68c45"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="M195 20 L215 38 L192 46 Z" fill="#d68c45" />
    </svg>
  );
}

export function GastroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <rect width="400" height="400" fill="#f2f2f2" />
      <circle cx="320" cy="80" r="120" fill="#e8ecef" />

      <path d="M130 90 L270 90 L255 210 Q200 240 145 210 Z" fill="#1b4965" />
      <rect x="192" y="210" width="16" height="70" fill="#1b4965" />
      <rect x="150" y="280" width="100" height="14" rx="7" fill="#1b4965" />

      <path d="M150 90 Q150 60 200 60 Q250 60 250 90 Z" fill="#5f7f93" opacity="0.6" />

      <rect x="80" y="230" width="18" height="130" rx="9" fill="#d68c45" />
      <path d="M80 230 Q89 210 98 230" fill="none" stroke="#d68c45" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
