import { createElement, useState, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { stylesToReactStyle } from "../../model/cssEngine";
import type { UixElement } from "../../model/types";
import { useProject } from "../../state/ProjectContext";

interface Props {
  element: UixElement;
  hoveredId: string | null;
  setHoveredId: Dispatch<SetStateAction<string | null>>;
}

const TEXT_TAGS = new Set(["h1", "h2", "h3", "p", "span", "button", "a"]);

export function ElementRenderer({ element, hoveredId, setHoveredId }: Props) {
  const { state, dispatch } = useProject();
  const isSelected = state.selectedId === element.id;
  const isHovered = hoveredId === element.id && !isSelected;

  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineContent, setInlineContent] = useState(element.content ?? "");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInlineContent(element.content ?? "");
  }, [element.content]);

  useEffect(() => {
    if (isEditingInline) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditingInline]);

  const style = stylesToReactStyle(element.styles);

  if (isHovered && !isSelected) {
    style.outline = "1.5px dashed #ec4899";
    style.outlineOffset = "1px";
  }
  if (element.hidden) style.opacity = 0.35;

  if (element.id === "root") {
    // Apenas o container principal tem tamanho mínimo de 100px
    if (!element.styles.width && !element.styles["min-width"]) {
      style.minWidth = "100px";
    }
    if (!element.styles.height && !element.styles["min-height"]) {
      style.minHeight = "100px";
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (TEXT_TAGS.has(element.tag) && !isEditingInline) {
      e.stopPropagation();
      setIsEditingInline(true);
    }
  };

  const commitInlineEdit = () => {
    setIsEditingInline(false);
    if (inlineContent !== element.content) {
      dispatch({ type: "UPDATE_CONTENT", id: element.id, content: inlineContent });
    }
  };

  const commonProps = {
    key: element.id,
    style,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditingInline) {
        dispatch({ type: "SELECT", id: element.id });
      }
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (isEditingInline) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (element.id !== "root") {
        e.stopPropagation();
        if (state.selectedId !== element.id) {
          dispatch({ type: "SELECT", id: element.id });
        }
      }
    },
    onDoubleClick: handleDoubleClick,
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
      draggable: false,
    });
  }

  if (element.tag === "input") {
    return createElement("input", {
      ...commonProps,
      placeholder: element.attributes?.placeholder || element.content || "Input",
      readOnly: true,
    });
  }

  // Inline editing overlay for text elements (Canva-style)
  if (isEditingInline) {
    return createElement(
      element.tag,
      commonProps,
      <input
        ref={editInputRef}
        className="canvas-inline-editor"
        value={inlineContent}
        onChange={(e) => setInlineContent(e.target.value)}
        onBlur={commitInlineEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitInlineEdit();
          if (e.key === "Escape") {
            setInlineContent(element.content ?? "");
            setIsEditingInline(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
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
