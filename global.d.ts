
export {};

declare global {
  // 1. Extensão de Variáveis de Ambiente (Node.js)
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      // Adicione suas variáveis de ambiente aqui:
      // API_URL: string;
      // PORT: string;
    }
  }

  // 2. Extensão do Objeto Window (Navegador)
  interface Window {
    // Adicione propriedades globais injetadas no window aqui:
    // dataLayer: any[];
    // google_analytics?: boolean;
    google?: { maps: any };
  }
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 3. Declaração de Módulos para Arquivos Estáticos (Frontend)
declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string;
  export default src;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

// 4. Declaração para CSS/SCSS Modules
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
