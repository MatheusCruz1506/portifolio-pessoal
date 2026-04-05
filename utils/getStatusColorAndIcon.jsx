import {
  Building2,
  CentroUniversitarioIcon,
  HospitalIcon,
  MissaoIcon,
  OutrosIcon,
  ParoquiaIcon,
  SeminarioIcon,
  CasaDeRepousoIcon,
} from "../src/icons";

export const getStatusColor = (status) => {
  switch (status) {
    case "Ativo":
      return {
        classes:
          "light:bg-emerald-100 light:text-emerald-700 light:border-emerald-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
        dot: "bg-emerald-500 dark:bg-green-500",
      };
    case "Vendido":
      return {
        classes:
          "light:bg-sky-100 light:text-sky-700 light:border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700",
        dot: "bg-sky-500 dark:bg-sky-500",
      };
    case "Em Construção":
      return {
        classes:
          "light:bg-amber-100 light:text-amber-700 light:border-amber-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
        dot: "bg-amber-500 dark:bg-yellow-500",
      };
    case "Inativo":
      return {
        classes:
          "light:bg-rose-100 light:text-rose-700 light:border-rose-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
        dot: "bg-rose-500 dark:bg-red-500",
      };
    default:
      return {
        classes: "bg-hover-bg text-text-secondary border-border-subtle",
        dot: "bg-gray-400",
      };
  }
};

export const getTypeIcon = (type) => {
  const iconProps = { className: "w-4 h-4" };
  switch (type) {
    case "Hospital":
      return <HospitalIcon {...iconProps} />;
    case "Centro Universitário":
      return <CentroUniversitarioIcon {...iconProps} />;
    case "Paróquia":
      return <ParoquiaIcon {...iconProps} />;
    case "Missão":
      return <MissaoIcon {...iconProps} />;
    case "Casa de Repouso":
      return <CasaDeRepousoIcon {...iconProps} />;
    case "Seminário":
      return <SeminarioIcon {...iconProps} />;
    case "Outro":
      return <OutrosIcon {...iconProps} />;
    default:
      return <Building2 {...iconProps} />;
  }
};

export const getTypeBadgeClasses = (type) => {
  switch (type) {
    case "Hospital":
      return "light:bg-red-100 light:text-red-600 light:border-red-200 dark:bg-red-900/20 dark:text-red-400";
    case "Centro Universitário":
      return "light:bg-blue-100 light:text-blue-600 light:border-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
    case "Paróquia":
      return "light:bg-purple-100 light:text-purple-600 light:border-purple-200 dark:bg-purple-900/20 dark:text-purple-400";
    case "Casa de Repouso":
      return "light:bg-emerald-100 light:text-emerald-700 light:border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400";
    case "Seminário":
      return "light:bg-amber-100 light:text-amber-700 light:border-amber-200 dark:bg-amber-900/20 dark:text-amber-500";
    case "Missão":
      return "light:bg-pink-100 light:text-pink-600 light:border-pink-200 dark:bg-pink-900/20 dark:text-pink-400";
    case "Outro":
    default:
      return "light:bg-gray-100 light:text-gray-600 light:border-gray-200 dark:bg-gray-900/30 dark:text-gray-400";
  }
};
