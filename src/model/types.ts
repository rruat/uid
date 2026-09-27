// .uix document model — the source of truth for a project.
// The canvas, tree view, code view and exporter all read/write this same structure.

export type CSSProperties = Partial<Record<string, string>>;

export type ElementTag =
  | "div"
  | "section"
  | "main"
  | "header"
  | "footer"
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "span"
  | "button"
  | "img"
  | "input"
  | "textarea"
  | "a"
  | "ul"
  | "li";

export interface UixElement {
  id: string;
  tag: ElementTag;
  name: string;
  content?: string;
  attributes?: Record<string, string>;
  styles: CSSProperties;
  classes?: string[];
  children: UixElement[];
  events?: Record<string, string>;
  locked?: boolean;
  hidden?: boolean;
}

export interface UixVariable {
  name: string;
  value: string;
}

export interface UixAsset {
  id: string;
  name: string;
  type: "image" | "svg" | "icon";
  dataUrl: string;
}

export interface UixSettings {
  canvasBackground?: string;
  viewport: "mobile" | "tablet" | "desktop";
}

export interface UixDocument {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: UixSettings;
  variables: UixVariable[];
  assets: UixAsset[];
  root: UixElement;
}

export const DEFAULT_VIEWPORT_WIDTHS: Record<UixSettings["viewport"], number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
};
