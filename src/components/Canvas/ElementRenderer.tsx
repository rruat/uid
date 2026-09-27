import { createElement } from "react";
import type { Dispatch, SetStateAction } from "react";
import { stylesToReactStyle } from "../../model/cssEngine";
import type { UixElement } from "../../model/types";
import { useProject } from "../../state/ProjectContext";

interface Props {
  element: UixElement;
  hoveredId: string | null;
  setHoveredId: Dispatch<SetStateAction<string | null>>;
}

export function ElementRenderer({ element, hoveredId, setHoveredId }: Props) {
  const { state, dispatch } = useProject();
  const isSelected = state.selectedId === element.id;
  const isHovered = hoveredId === element.id && !isSelected;

  const style = stylesToReactStyle(element.styles);
  if (isSelected) {
    style.outline = "2px dashed var(--selection)";
    style.outlineOffset = "2px";
  } else if (isHovered) {
    style.outline = "1.5px dashed var(--border-strong)";
    style.outlineOffset = "2px";
  }
  if (element.hidden) style.opacity = 0.35;

  // A lone free-form card can otherwise collapse to ~0×0 (just its own
  // padding) before it has real content or explicit sizing — give it a
  // visible placeholder size/color so there's always something to select.
  if (element.id === "root" && state.present.settings.viewport === "free") {
    const hasSize =
      element.styles.width || element.styles.height || element.styles["min-width"] || element.styles["min-height"];
    if (!hasSize) {
      style.minWidth = "100px";
      style.minHeight = "100px";
    }
    const hasBackground = element.styles.background || element.styles["background-color"];
    if (!hasBackground) style.background = "var(--placeholder-bg)";
  }

  const commonProps = {
    key: element.id,
    style,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: "SELECT", id: element.id });
    },
    onMouseEnter: (e: React.MouseEvent) => {
      e.stopPropagation();
      setHoveredId(element.id);
    },
    onMouseLeave: () => setHoveredId((prev) => (prev === element.id ? null : prev)),
    "data-el-id": element.id,
    className: element.classes?.join(" "),
  };

  if (element.tag === "img") {
    return createElement("img", {
      ...commonProps,
      src: element.attributes?.src || FALLBACK_IMG,
      alt: element.attributes?.alt || "",
    });
  }

  if (element.tag === "input") {
    return createElement("input", {
      ...commonProps,
      placeholder: element.attributes?.placeholder || element.content || "Input",
      readOnly: true,
    });
  }

  const children =
    element.children.length > 0
      ? element.children.map((child) => (
          <ElementRenderer
            key={child.id}
            element={child}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
          />
        ))
      : element.content;

  return createElement(element.tag, commonProps, children);
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='120'><rect width='100%' height='100%' fill='%23f0f0f0'/><text x='50%' y='50%' font-size='12' fill='%23999' text-anchor='middle' dy='.3em'>imagem</text></svg>`
  );
