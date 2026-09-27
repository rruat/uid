import { useCallback, useRef, useState } from "react";
import { DEFAULT_VIEWPORT_WIDTHS } from "../../model/types";
import { useProject } from "../../state/ProjectContext";
import { ElementRenderer } from "./ElementRenderer";
import "./canvas.css";

interface Pointer {
  x: number;
  y: number;
}

export function Canvas() {
  const { state, dispatch } = useProject();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 60, y: 40, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
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
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      const isBackground = e.target === e.currentTarget;
      draggingBackground.current = isBackground;
      if (isBackground) dispatch({ type: "SELECT", id: null });
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origin: { x: transform.x, y: transform.y },
      };
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { startDist: dist, startScale: transform.scale };
      panRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchRef.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const factor = dist / (pinchRef.current.startDist || 1);
      const targetScale = clampScale(pinchRef.current.startScale * factor);
      setTransform((t) => ({ ...t, scale: targetScale }));
      zoomAt(midX, midY, 1);
      return;
    }

    if (pointers.current.size === 1 && panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setTransform((t) => ({ ...t, x: panRef.current!.origin.x + dx, y: panRef.current!.origin.y + dy }));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) panRef.current = null;
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
        <div className="uid-artboard" style={{ width: artboardWidth }}>
          <ElementRenderer
            element={state.present.root}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
          />
        </div>
      </div>

      <div className="uid-canvas__zoom">
        <button className="ui-btn is-icon" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.8)}>
          −
        </button>
        <span>{Math.round(transform.scale * 100)}%</span>
        <button className="ui-btn is-icon" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.25)}>
          +
        </button>
      </div>
    </div>
  );
}
