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
      position: "relative",
      gap: "12px",
      padding: "16px",
      width: "100%",
      height: "120px",
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
      position: "relative",
      width: "100%",
      height: "80px",
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
      position: "absolute",
      left: "20px",
      top: "20px",
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
      position: "absolute",
      left: "20px",
      top: "20px",
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
      position: "absolute",
      left: "20px",
      top: "60px",
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
      position: "absolute",
      left: "20px",
      top: "100px",
      display: "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      padding: "10px 20px",
      "border-radius": "10px",
      border: "1.5px solid #4c4cf0",
      background: "#4c4cf0",
      color: "#ffffff",
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
      position: "absolute",
      left: "20px",
      top: "20px",
      width: "200px",
      height: "140px",
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
      position: "absolute",
      left: "20px",
      top: "150px",
      width: "220px",
      padding: "10px 12px",
      "border-radius": "8px",
      border: "1.5px solid #d0d0d0",
      "font-size": "15px",
    },
  },
];

export function createElementFromPreset(preset: ElementPreset): UixElement {
  const isContainer = preset.acceptsChildren;
  const styles: CSSProperties = {
    ...preset.defaultStyles,
    position: isContainer ? "relative" : "absolute",
  };
  if (!isContainer) {
    if (!styles.left) styles.left = "20px";
    if (!styles.top) styles.top = "20px";
  }
  return {
    id: createId(),
    tag: preset.tag,
    name: preset.label,
    content: preset.defaultContent,
    attributes: preset.tag === "img" ? { src: "", alt: "" } : undefined,
    styles,
    classes: [],
    children: [],
  };
}
