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

export type Viewport = "mobile" | "tablet" | "desktop" | "free";

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

export interface CustomGuide {
  id: string;
  type: "x" | "y"; // x = vertical guide line, y = horizontal guide line
  pos: number; // coordinate in px relative to scope (artboard or container)
}

export interface GridConfig {
  enabled: boolean;
  size: number; // interval in px (e.g. 8, 16, 24)
  orientation: "both" | "horizontal" | "vertical";
  color: string;
  opacity: number;
  thickness: number;
  snap: boolean;
}

export interface GuideSet {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  snapEnabled: boolean;
  scope: "global" | string; // "global" or container element ID
  grid: GridConfig;
  guides: CustomGuide[];
}

export interface UixSettings {
  canvasBackground?: string;
  viewport: Viewport;
  showRulers?: boolean;
  smartSnap?: boolean;
}

export interface UixDocument {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: UixSettings;
  variables: UixVariable[];
  assets: UixAsset[];
  guideSets?: GuideSet[];
  root: UixElement;
}

// `free` has no fixed width: the artboard hugs whatever the user builds
// (e.g. a single card), instead of forcing a full device-page frame.
export const DEFAULT_VIEWPORT_WIDTHS: Record<Viewport, number | null> = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
  free: null,
};
