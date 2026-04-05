import { RotateCcw, ZoomIn, ZoomOut, type LucideProps } from "lucide-react";
import Activity from "lucide-react/dist/esm/icons/activity.js";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle.js";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import Bolt from "lucide-react/dist/esm/icons/bolt.js";
import Building2 from "lucide-react/dist/esm/icons/building-2.js";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.js";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import Church from "lucide-react/dist/esm/icons/church.js";
import Edit2 from "lucide-react/dist/esm/icons/edit-2.js";
import Ellipsis from "lucide-react/dist/esm/icons/ellipsis.js";
import ExternalLink from "lucide-react/dist/esm/icons/external-link.js";
import Eye from "lucide-react/dist/esm/icons/eye.js";
import EyeOff from "lucide-react/dist/esm/icons/eye-off.js";
import FileText from "lucide-react/dist/esm/icons/file-text.js";
import Filter from "lucide-react/dist/esm/icons/filter.js";
import Globe from "lucide-react/dist/esm/icons/globe.js";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap.js";
import Hospital from "lucide-react/dist/esm/icons/hospital.js";
import House from "lucide-react/dist/esm/icons/house.js";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard.js";
import List from "lucide-react/dist/esm/icons/list.js";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.js";
import LockKeyhole from "lucide-react/dist/esm/icons/lock-keyhole.js";
import LogOut from "lucide-react/dist/esm/icons/log-out.js";
import Mail from "lucide-react/dist/esm/icons/mail.js";
import MapPin from "lucide-react/dist/esm/icons/map-pin.js";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical.js";
import Phone from "lucide-react/dist/esm/icons/phone.js";
import Search from "lucide-react/dist/esm/icons/search.js";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import UserRound from "lucide-react/dist/esm/icons/user-round.js";
import Users from "lucide-react/dist/esm/icons/users.js";
import X from "lucide-react/dist/esm/icons/x.js";

// Wrapper icons (componentes React usados na sidebar, forms, auth, etc.)

// -----------------------------------------------------------------------------

// tipos de unidade

// ZoomOut,
// RotateCcw,


export function RotateCcwIcon(props: LucideProps) {
  return <RotateCcw {...props} />;
}

export function ZoomOutIcon(props: LucideProps) {
  return <ZoomOut {...props} />;
}

export function ZoomInIcon(props: LucideProps) {
  return <ZoomIn {...props} />;
}

export function HospitalIcon(props: LucideProps) {
  return <Hospital {...props} />;
}

export function CentroUniversitarioIcon(props: LucideProps) {
  return <GraduationCap {...props} />;
}

export function ParoquiaIcon(props: LucideProps) {
  return <Building2 {...props} />;
}

export function CasaDeRepousoIcon(props: LucideProps) {
  return <House {...props} />;
}

export function SeminarioIcon(props: LucideProps) {
  return <Church {...props} />;
}

export function MissaoIcon(props: LucideProps) {
  return <Users {...props} />;
}

export function OutrosIcon(props: LucideProps) {
  return <Ellipsis {...props} />;
}

// -----------------------------------------------------------------------------

export function DashboardIcon(props: LucideProps) {
  return <LayoutDashboard {...props} />;
}

export function InactiveIcon(props: LucideProps) {
  return <X {...props} />;
}

export function ImoveisIcon(props: LucideProps) {
  return <House {...props} />;
}

export function InventoryIcon(props: LucideProps) {
  return <List {...props} />;
}

export function MapsIcon(props: LucideProps) {
  return <MapPin {...props} />;
}

export function ConfigIcon(props: LucideProps) {
  return <Bolt {...props} />;
}

export function SearchIcon(props: LucideProps) {
  return <Search {...props} />;
}

export function EmailIcon(props: LucideProps) {
  return <Mail {...props} />;
}

export function PasswordIcon(props: LucideProps) {
  return <LockKeyhole {...props} />;
}

export function OnEyeIcon(props: LucideProps) {
  return <Eye {...props} />;
}

export function OffEyeIcon(props: LucideProps) {
  return <EyeOff {...props} />;
}

export function LogoutIcon(props: LucideProps) {
  return <LogOut {...props} />;
}

export function UserIcon(props: LucideProps) {
  return <UserRound {...props} />;
}

// -----------------------------------------------------------------------------
// Re-exports diretos de lucide-react (usados em components/ui e pages)
// -----------------------------------------------------------------------------

export {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  X,
};

// Alias para não conflitar com o wrapper UserIcon acima
export { UserRound as UserRoundIcon };

// -----------------------------------------------------------------------------
// Mapa de ícones SVG para pins no mapa
// -----------------------------------------------------------------------------

/**
 * Cria um ícone de pin SVG com ícone Lucide embutido.
 * viewBox: 42×57 (1.5× do original 28×38)
 *
 * Círculo branco: cx=21, cy=18, r=12
 * Ícone 24×24 com scale=0.750 → renderiza 18×18 px
 * translate: x = 21 - (24×0.75)/2 = 12
 *            y = 18 - (24×0.75)/2 = 9
 *
 * @param {string} color      - Cor hexadecimal do pin
 * @param {string} iconPaths  - SVG paths/shapes do ícone (viewBox 24x24)
 * @returns {string}
 */
function createPinIcon(color: string, iconPaths: string) {
  const iconGroup = `
    <g transform="translate(12,9) scale(0.750)"
       fill="none"
       stroke="${color}"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round">
      ${iconPaths}
    </g>
  `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="57" viewBox="0 0 42 57">
      <!-- Sombra (coordenadas × 1.5) -->
      <ellipse cx="21" cy="54" rx="9" ry="3.75" fill="rgba(0,0,0,0.25)" />
      <!-- Corpo do pin (todos os pontos × 1.5) -->
      <path
        d="M21 1.5C11.887 1.5 4.5 8.887 4.5 18c0 12.375 16.5 37.5 16.5 37.5S37.5 30.375 37.5 18C37.5 8.887 30.112 1.5 21 1.5z"
        fill="${color}"
        stroke="white"
        stroke-width="2.7"
      />
      <!-- Círculo interno branco -->
      <circle cx="21" cy="18" r="12" fill="white" />
      <!-- Ícone Lucide centralizado no círculo -->
      ${iconGroup}
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Paths Lucide (viewBox 24×24)
// ---------------------------------------------------------------------------

const ICONS = {
  // <Hospital />
  hospital: `
    <path d="M12 6v4"/>
    <path d="M14 14h-4"/>
    <path d="M14 18h-4"/>
    <path d="M14 8h-4"/>
    <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/>
    <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>
  `,
  // <GraduationCap />
  graduationCap: `
    <path d="M22 10v6"/>
    <path d="M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  `,
  // <Building2 />
  building2: `
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  `,
  // <House />
  house: `
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  `,
  // <Church />
  church: `
    <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2"/>
    <path d="M14 22v-4a2 2 0 0 0-4 0v4"/>
    <path d="M18 22V5l-6-3-6 3v17"/>
    <path d="M12 7v5"/>
    <path d="M10 9h4"/>
  `,
  // <HouseHeart />
  users: `
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>
  `,
  // <Ellipsis />
  ellipsis: `
  <circle cx="12" cy="12" r="1"/>
  <circle cx="19" cy="12" r="1"/>
  <circle cx="5"  cy="12" r="1"/>
  `,
};
// ---------------------------------------------------------------------------
// Mapa de ícones exportado
// Chaves em lowercase para bater com `iconKey = typeStr.toLowerCase()`
// ---------------------------------------------------------------------------

export const iconsConfigMap = {
  hospital: createPinIcon("#991b1b", ICONS.hospital),
  "centro universitário": createPinIcon("#3b82f6", ICONS.graduationCap),
  paróquia: createPinIcon("#8b5cf6", ICONS.building2),
  "casa de repouso": createPinIcon("#10b981", ICONS.house),
  seminário: createPinIcon("#f59e0b", ICONS.church),
  missão: createPinIcon("#ec4899", ICONS.users),
  outro: createPinIcon("#c6973f", ICONS.ellipsis),
};
