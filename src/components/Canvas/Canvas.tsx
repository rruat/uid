import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_VIEWPORT_WIDTHS } from "../../model/types";
import { useProject } from "../../state/ProjectContext";
import { ElementRenderer } from "./ElementRenderer";
import { SelectionOverlay } from "./SelectionOverlay";
import { Rulers } from "./Rulers";
import { VisualGridOverlay } from "./VisualGridOverlay";
import "./canvas.css";

interface Pointer {
  x: number;
  y: number;
}

interface CanvasProps {
  onOpenGuidesPanel?: () => void;
}

export function Canvas({ onOpenGuidesPanel }: CanvasProps) {
  const { state, dispatch } = useProject();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [transform, setTransform] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      const artW = 390;
      const availW = window.innerWidth - 24;
      const s = Math.min(1, Math.max(0.6, availW / artW));
      const x = Math.max(8, (window.innerWidth - artW * s) / 2);
      return { x, y: 16, scale: s };
    }
    return { x: 80, y: 40, scale: 1 };
  });
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const containerRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, Pointer>>(new Map());
  const panRef = useRef<{ startX: number; startY: number; origin: { x: number; y: number } } | null>(
    null
  );
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const draggingBackground = useRef(false);

  const artboardWidth = DEFAULT_VIEWPORT_WIDTHS[state.present.settings.viewport];

  const clampScale = (s: number) => Math.min(3, Math.max(0.2, s));

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    setTransform((t) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = clientX - (rect?.left ?? 0);
      const cy = clientY - (rect?.top ?? 0);
      const newScale = clampScale(t.scale * factor);
      const ratio = newScale / t.scale;
      return {
        scale: newScale,
        x: cx - (cx - t.x) * ratio,
        y: cy - (cy - t.y) * ratio,
      };
    });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = Math.exp(-e.deltaY * 0.01);
      zoomAt(e.clientX, e.clientY, factor);
    } else {
      setTransform((t) => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // If clicked on resize handle, badge, bounding box, or toolbar, let that handle it
    const target = e.target as HTMLElement;
    if (
      target.closest(".resize-handle") ||
      target.closest(".selection-badge") ||
      target.closest(".resize-handle-edge") ||
      target.closest(".selection-bounding-box") ||
      target.closest(".selection-drag-surface") ||
      target.closest(".custom-guide-line") ||
      target.closest(".custom-guide-badge") ||
      target.closest(".smart-toolbar") ||
      target.closest(".uid-canvas__zoom")
    ) {
      return;
    }

    const isBackground =
      target === e.currentTarget ||
      target.classList.contains("uid-canvas__surface") ||
      target.classList.contains("uid-artboard");

    if (isBackground) {
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture error
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 1) {
        draggingBackground.current = true;
        dispatch({ type: "SELECT", id: null });
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          origin: { x: transformRef.current.x, y: transformRef.current.y },
        };
      }
    } else {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      panRef.current = null;
    }

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { startDist: dist, startScale: transformRef.current.scale };
      panRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchRef.current) {
      const currentPinch = pinchRef.current;
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const factor = dist / (currentPinch.startDist || 1);
      const targetScale = clampScale(currentPinch.startScale * factor);
      setTransform((t) => ({ ...t, scale: targetScale }));
      zoomAt(midX, midY, 1);
      return;
    }

    const currentPan = panRef.current;
    if (pointers.current.size === 1 && currentPan) {
      const dx = e.clientX - currentPan.startX;
      const dy = e.clientY - currentPan.startY;
      const originX = currentPan.origin.x;
      const originY = currentPan.origin.y;
      setTransform((t) => ({ ...t, x: originX + dx, y: originY + dy }));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) {
      panRef.current = null;
      draggingBackground.current = false;
    }
  };

  // Drag and drop presets from sidebar directly onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const presetKey = e.dataTransfer.getData("text/uix-preset") || e.dataTransfer.getData("text/plain");
    if (!presetKey) return;

    const els = document.elementsFromPoint(e.clientX, e.clientY);
    let targetId = "root";
    for (const el of els) {
      const id = el.getAttribute("data-el-id");
      if (id) {
        targetId = id;
        break;
      }
    }
    dispatch({ type: "ADD_ELEMENT", parentId: targetId, presetKey });
  };

  return (
    <div
      ref={containerRef}
      className="uid-canvas"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div
        className="uid-canvas__surface"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <div
          ref={artboardRef}
          className={`uid-artboard ${artboardWidth === null ? "uid-artboard--free" : ""}`}
          style={artboardWidth === null ? undefined : { width: artboardWidth }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Visual Grid and Custom Guide lines */}
          <VisualGridOverlay scale={transform.scale} />

          <ElementRenderer
            element={state.present.root}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
          />
          <SelectionOverlay artboardRef={artboardRef} scale={transform.scale} />
        </div>
      </div>

      {/* Canvas Top & Left Rulers */}
      <Rulers transform={transform} onOpenGuidesPanel={onOpenGuidesPanel} />

      <div className="uid-canvas__zoom">
        <button
          type="button"
          className="ui-btn is-icon"
          style={{ width: 28, height: 28 }}
          onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.8)}
          title="Diminuir zoom"
        >
          −
        </button>
        <span>{Math.round(transform.scale * 100)}%</span>
        <button
          type="button"
          className="ui-btn is-icon"
          style={{ width: 28, height: 28 }}
          onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.25)}
          title="Aumentar zoom"
        >
          +
        </button>
        <button
          type="button"
          className="ui-btn"
          style={{ height: 28, padding: "0 8px", fontSize: 11 }}
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth <= 768) {
              const artW = 390;
              const availW = window.innerWidth - 24;
              const s = Math.min(1, Math.max(0.6, availW / artW));
              const x = Math.max(8, (window.innerWidth - artW * s) / 2);
              setTransform({ x, y: 16, scale: s });
            } else {
              setTransform({ x: 80, y: 40, scale: 1 });
            }
          }}
          title="Ajustar visualização ao ecrã"
        >
          {typeof window !== "undefined" && window.innerWidth <= 768 ? "Ajustar" : "100%"}
        </button>
      </div>
    </div>
  );
}
