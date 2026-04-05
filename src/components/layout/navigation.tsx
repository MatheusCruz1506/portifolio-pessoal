import {
  ConfigIcon,
  DashboardIcon,
  ImoveisIcon,
  MapsIcon,
} from "../../icons";

export const navigationItems = [
  { path: "/dashboard", nameKey: "sidebar.dashboard", Icon: DashboardIcon },
  { path: "/imoveis", nameKey: "sidebar.imoveis", Icon: ImoveisIcon },
  { path: "/map", nameKey: "sidebar.map", Icon: MapsIcon },
  { path: "/config", nameKey: "sidebar.config", Icon: ConfigIcon },
] as const;
