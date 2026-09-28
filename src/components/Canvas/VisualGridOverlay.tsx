import React from "react";
import { useProject } from "../../state/ProjectContext";
import type { GuideSet } from "../../model/types";
import "./visualGrid.css";

interface VisualGridOverlayProps {
  scale: number;
}

export function VisualGridOverlay({ scale }: VisualGridOverlayProps) {
  const { state, dispatch } = useProject();
  const guideSets: GuideSet[] = state.present.guideSets || [];

  const visibleSets = guideSets.filter((s) => s.visible);
  const activeGrids = visibleSets.filter((s) => s.grid && s.grid.enabled && s.grid.size > 0);

  // Guide dragging state
  const handleGuideDrag = (guideSetId: string, guideId: string, type: "x" | "y", e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startPos = type === "x" ? e.clientX : e.clientY;
    const targetEl = e.currentTarget.parentElement;
    if (!targetEl) return;

    const setObj = guideSets.find((s) => s.id === guideSetId);
    const guideObj = setObj?.guides.find((g) => g.id === guideId);
    if (!guideObj) return;

    const initialPos = guideObj.pos;

    const onPointerMove = (moveEv: PointerEvent) => {
      const delta = ((type === "x" ? moveEv.clientX : moveEv.clientY) - startPos) / scale;
      const nextPos = Math.max(0, Math.round(initialPos + delta));
      dispatch({
        type: "UPDATE_CUSTOM_GUIDE",
        guideSetId,
        guideId,
        pos: nextPos,
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div className="visual-grid-overlay" aria-hidden="true">
      {/* Visual Grids SVG Overlays */}
      {activeGrids.length > 0 && (
        <svg className="visual-grid-svg" width="100%" height="100%">
          <defs>
            {activeGrids.map((set) => {
              const { size, orientation, color, opacity, thickness } = set.grid;
              const patId = `grid-pattern-${set.id}`;
              const strokeColor = color || set.color || "#6366f1";
              const strokeWidth = thickness || 1;

              return (
                <pattern
                  key={set.id}
                  id={patId}
                  width={size}
                  height={size}
                  patternUnits="userSpaceOnUse"
                >
                  {(orientation === "both" || orientation === "horizontal") && (
                    <line
                      x1="0"
                      y1={size}
                      x2={size}
                      y2={size}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity ?? 0.15}
                    />
                  )}
                  {(orientation === "both" || orientation === "vertical") && (
                    <line
                      x1={size}
                      y1="0"
                      x2={size}
                      y2={size}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity ?? 0.15}
                    />
                  )}
                </pattern>
              );
            })}
          </defs>

          {activeGrids.map((set) => (
            <rect
              key={set.id}
              width="100%"
              height="100%"
              fill={`url(#grid-pattern-${set.id})`}
            />
          ))}
        </svg>
      )}

      {/* Manual Custom Guide Lines */}
      {visibleSets.map((set) =>
        set.guides.map((g) => {
          const isX = g.type === "x";
          const color = set.color || "#6366f1";

          return (
            <div
              key={g.id}
              className={`custom-guide-line custom-guide-line--${g.type}`}
              style={
                isX
                  ? { left: `${g.pos}px`, backgroundColor: color }
                  : { top: `${g.pos}px`, backgroundColor: color }
              }
              onPointerDown={(e) => handleGuideDrag(set.id, g.id, g.type, e)}
              title={`Guia ${isX ? "Vertical" : "Horizontal"}: ${g.pos}px (Arrastar para mover)`}
            >
              <div
                className="custom-guide-badge"
                style={{
                  backgroundColor: color,
                  left: isX ? 4 : 8,
                  top: isX ? 8 : 4,
                }}
              >
                <span>{isX ? `X: ${g.pos}px` : `Y: ${g.pos}px`}</span>
                <button
                  type="button"
                  className="custom-guide-del"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: "REMOVE_CUSTOM_GUIDE",
                      guideSetId: set.id,
                      guideId: g.id,
                    });
                  }}
                  title="Remover guia"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
