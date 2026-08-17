/** Set d'icônes ligne fine, cohérent avec la DA INKU. */

type P = { size?: number; className?: string };

function base(size: number, className: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export const IconSun = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
  </svg>
);

export const IconTrophy = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M7 4h10v5a5 5 0 01-10 0z" />
    <path d="M7 6H4v1a4 4 0 004 4M17 6h3v1a4 4 0 01-4 4" />
    <path d="M12 14v3M9 20h6M10 17h4v3h-4z" />
  </svg>
);

export const IconStats = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const IconCalendar = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconHelp = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.6 2.6 0 015 .9c0 1.7-2.5 2.1-2.5 3.8" />
    <path d="M12 17.5h.01" />
  </svg>
);

export const IconCoin = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <ellipse cx="12" cy="6.5" rx="8" ry="3.5" />
    <path d="M4 6.5v11c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-11" />
    <path d="M4 12c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5" />
  </svg>
);

export const IconUsers = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0112 0" />
    <path d="M16 5.2a3.2 3.2 0 010 5.6M17.5 20a6 6 0 00-1.6-4.1" />
  </svg>
);

export const IconTimer = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M9.5 2h5" />
  </svg>
);

export const IconCheck = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const IconX = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconCopy = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <rect x="9" y="9" width="12" height="12" rx="3" />
    <path d="M15 5.5A2.5 2.5 0 0012.5 3h-7A2.5 2.5 0 003 5.5v7A2.5 2.5 0 005.5 15" />
  </svg>
);

export const IconCrown = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 7l4 4 5-6 5 6 4-4v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

export const IconFlag = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5" />
  </svg>
);

export const IconArrowRight = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const IconArrowLeft = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M20 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const IconEye = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IconPlug = ({ size = 20, className = "" }: P) => (
  <svg {...base(size, className)}>
    <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 01-6 6 6 6 0 01-6-6zM12 17v5" />
  </svg>
);
