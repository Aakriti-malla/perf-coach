function Svg({ size = 20, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-bark"
    >
      {children}
    </svg>
  );
}

type IconProps = { size?: number };

export const GaugeIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M3 14a7 7 0 0 1 14 0" />
    <path d="M10 14l3.5-4.5" />
    <circle cx="10" cy="14" r="1" />
  </Svg>
);

export const PersonCircleIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="10" cy="10" r="7.5" />
    <circle cx="10" cy="8" r="2.2" />
    <path d="M5.8 15.2c.9-2 2.4-3 4.2-3s3.3 1 4.2 3" />
  </Svg>
);

export const ShieldCheckIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M10 2.5l6 2.2v4.6c0 4-2.6 6.6-6 8.2-3.4-1.6-6-4.2-6-8.2V4.7l6-2.2z" />
    <path d="M7.2 9.8l2 2 3.6-3.8" />
  </Svg>
);

export const SearchIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="M13.2 13.2L17 17" />
  </Svg>
);

export const LightbulbIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.1 1 2h4c0-.9.4-1.5 1-2a5 5 0 0 0-3-9z" />
    <path d="M8.2 16.5h3.6" />
  </Svg>
);

export const WrenchIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M16.3 6.2a3.6 3.6 0 0 1-4.6 4.5l-6.2 6.1a1.4 1.4 0 0 1-2-2l6.1-6.2a3.6 3.6 0 0 1 4.5-4.6L12 5.8l.4 1.8 1.8.4 2.1-1.8z" />
  </Svg>
);

export const InfoIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 9.2v4.3" />
    <path d="M10 6.5v.01" />
  </Svg>
);

export const ChevronDownIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M5 8l5 5 5-5" />
  </Svg>
);
