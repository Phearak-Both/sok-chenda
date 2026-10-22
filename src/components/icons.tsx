import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Stroke({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Stroke>
);
export const MenuIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 8h17M3.5 16h17" />
  </Stroke>
);
export const CloseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Stroke>
);
export const ArrowRight = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 12h16m-5-5 5 5-5 5" />
  </Stroke>
);
export const ArrowLeft = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 12H4m5-5-5 5 5 5" />
  </Stroke>
);
export const ChevronLeft = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m15 5-7 7 7 7" />
  </Stroke>
);
export const ChevronRight = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m9 5 7 7-7 7" />
  </Stroke>
);
export const ChevronDown = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m5 9 7 7 7-7" />
  </Stroke>
);
export const PhoneIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 4h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </Stroke>
);
export const MailIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Stroke>
);
export const PinIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Stroke>
);
export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Stroke>
);
export const CopyIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Stroke>
);
export const CheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Stroke>
);
export const PlusIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);
export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4.5 7h15M10 11v6m4-6v6M6 7l1 12.5h10L18 7M9.5 7V4.5h5V7" />
  </Stroke>
);
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Stroke {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8Z" />
  </Stroke>
);
export const EyeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Stroke>
);
export const UploadIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 15.5V4m-4.5 4.5L12 4l4.5 4.5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Stroke>
);
export const ImageIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 18 5-5 4 4 2.5-2.5L20 19" />
  </Stroke>
);
export const LogoutIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M14 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h8M10 12h10m-3.5-3.5L20 12l-3.5 3.5" />
  </Stroke>
);
export const HomeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1Z" />
  </Stroke>
);
export const GemIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6.5 4.5h11l3.5 5-9 10-9-10Z" />
    <path d="M3 9.5h18M9 4.5l3 15 3-15" />
  </Stroke>
);
export const LayersIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 4 8.5 4.5L12 13 3.5 8.5Z" />
    <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
  </Stroke>
);
export const TagIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1 1 0 0 1 0 1.4l-7.8 7.8a1 1 0 0 1-1.4 0Z" />
    <circle cx="8" cy="8" r="1.4" />
  </Stroke>
);
export const CoinsIcon = (p: IconProps) => (
  <Stroke {...p}>
    <ellipse cx="9" cy="6.5" rx="5.5" ry="2.5" />
    <path d="M3.5 6.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" />
    <path d="M9.5 15.4c.9.4 2.1.6 3.5.6 3 0 5.5-1.1 5.5-2.5v-4c0-1.2-1.8-2.2-4.2-2.4" />
    <path d="M9.5 19.4c.9.4 2.1.6 3.5.6 3 0 5.5-1.1 5.5-2.5v-4" />
  </Stroke>
);
export const LayoutIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="1.5" />
    <path d="M3.5 9.5h17M10 9.5V20" />
  </Stroke>
);
export const SettingsIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 3.5v2.2m0 12.6v2.2M3.5 12h2.2m12.6 0h2.2M6 6l1.6 1.6m8.8 8.8L18 18M6 18l1.6-1.6m8.8-8.8L18 6" />
  </Stroke>
);
export const UserIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Stroke>
);
export const ExternalIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M13.5 4.5h6v6M19.5 4.5 11 13M17.5 14v4.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H10" />
  </Stroke>
);

/* Brand marks, simplified to single-colour glyphs. */
function Solid({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}
export const WhatsAppIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.8-1.3A9.4 9.4 0 1 0 12 2.5Zm0 17.1a7.7 7.7 0 0 1-3.9-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.6Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
  </Solid>
);
export const TelegramIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M21.4 4.2 2.9 11.3c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.4-1.5ZM8.9 14l9.2-5.8c.5-.3.9-.1.5.2l-7.6 6.9-.3 3.2Z" />
  </Solid>
);
export const FacebookIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M13.5 21v-7.7h2.6l.4-3h-3V8.4c0-.9.3-1.5 1.5-1.5h1.6V4.2a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21Z" />
  </Solid>
);
export const InstagramIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </Stroke>
);
export const TikTokIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M16.6 3h-3v11.8a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.2a5.7 5.7 0 1 0 4.8 5.6V9a7.3 7.3 0 0 0 4.2 1.3V7.3A4.3 4.3 0 0 1 16.6 3Z" />
  </Solid>
);
