import { createId } from "./id";
import type { CSSProperties, ElementTag, UixElement } from "./types";

export interface ElementPreset {
  key: string;
  label: string;
  icon: string;
  tag: ElementTag;
  defaultStyles: CSSProperties;
  defaultContent?: string;
  acceptsChildren: boolean;
}

export const ELEMENT_PRESETS: ElementPreset[] = [
  {
    key: "container",
    label: "Container",
    icon: "square",
    tag: "div",
    acceptsChildren: true,
    defaultStyles: {
      display: "flex",
      "flex-direction": "column",
      gap: "12px",
      padding: "16px",
      width: "100%",
      height: "80px",
    },
  },
  {
    key: "div",
    label: "Div",
    icon: "square-dashed",
    tag: "div",
    acceptsChildren: true,
    defaultStyles: {
      display: "block",
      width: "100%",
      height: "40px",
    },
  },
  {
    key: "text",
    label: "Texto",
    icon: "type",
    tag: "p",
    acceptsChildren: false,
    defaultContent: "Texto",
    defaultStyles: {
      "font-size": "16px",
      color: "var(--doc-text, #1a1a1a)",
    },
  },
  {
    key: "title",
    label: "Título",
    icon: "heading",
    tag: "h1",
    acceptsChildren: false,
    defaultContent: "Título",
    defaultStyles: {
      "font-size": "28px",
      "font-weight": "700",
      color: "var(--doc-text, #1a1a1a)",
    },
  },
  {
    key: "paragraph",
    label: "Parágrafo",
    icon: "text",
    tag: "p",
    acceptsChildren: false,
    defaultContent: "Parágrafo de exemplo.",
    defaultStyles: {
      "font-size": "15px",
      "line-height": "1.5",
      color: "var(--doc-text, #1a1a1a)",
    },
  },
  {
    key: "button",
    label: "Botão",
    icon: "pointer",
    tag: "button",
    acceptsChildren: false,
    defaultContent: "Botão",
    defaultStyles: {
      display: "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      padding: "10px 20px",
      "border-radius": "10px",
      border: "1.5px solid currentColor",
      background: "transparent",
      "font-size": "15px",
      "font-weight": "600",
    },
  },
  {
    key: "image",
    label: "Imagem",
    icon: "image",
    tag: "img",
    acceptsChildren: false,
    defaultStyles: {
      width: "100%",
      height: "160px",
      "object-fit": "cover",
      "border-radius": "8px",
    },
  },
  {
    key: "input",
    label: "Input",
    icon: "text-cursor",
    tag: "input",
    acceptsChildren: false,
    defaultStyles: {
      width: "100%",
      padding: "10px 12px",
      "border-radius": "8px",
      border: "1.5px solid #d0d0d0",
      "font-size": "15px",
    },
  },
];

export function createElementFromPreset(preset: ElementPreset): UixElement {
  return {
    id: createId(),
    tag: preset.tag,
    name: preset.label,
    content: preset.defaultContent,
    attributes: preset.tag === "img" ? { src: "", alt: "" } : undefined,
    styles: { ...preset.defaultStyles },
    classes: [],
    children: [],
  };
}
