import React, { useEffect, useState, useCallback, useRef } from "react";
import { useProject } from "../../state/ProjectContext";
import { findElement, findParent, isDescendant } from "../../model/document";
import { Icon } from "../Icon";

interface SelectionOverlayProps {
  artboardRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
}

type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface GuideLine {
  type: "x" | "y";
  pos: number;
  color?: string;
}

interface DistanceBadge {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  value: number;
  orientation: "horizontal" | "vertical";
}

interface DropIndicator {
  parentId: string;
  index: number;
  rect: { x: number; y: number; width: number; height: number };
  orientation: "horizontal" | "vertical";
}

export function SelectionOverlay({ artboardRef, scale }: SelectionOverlayProps) {
  const { state, dispatch } = useProject();
  const selectedId = state.selectedId;

  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [distances, setDistances] = useState<DistanceBadge[]>([]);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [artboardHeight, setArtboardHeight] = useState<number>(800);

  const boxElRef = useRef<HTMLDivElement | null>(null);

  const resizeRef = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    currentW: number;
    currentH: number;
  } | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    curX: number;
    curY: number;
    hasMoved: boolean;
  } | null>(null);

  // Measure the selected element on the canvas
  const updateBox = useCallback(() => {
    if (!selectedId || selectedId === "root" || !artboardRef.current) {
      setBox(null);
      return;
    }

    const domEl = artboardRef.current.querySelector(`[data-el-id="${selectedId}"]`) as HTMLElement | null;
    if (!domEl) {
      setBox(null);
      return;
    }

    const artRect = artboardRef.current.getBoundingClientRect();
    const elRect = domEl.getBoundingClientRect();

    setArtboardHeight(artRect.height / scale);

    setBox({
      x: (elRect.left - artRect.left) / scale,
      y: (elRect.top - artRect.top) / scale,
      width: elRect.width / scale,
      height: elRect.height / scale,
    });
  }, [selectedId, artboardRef, scale]);

  useEffect(() => {
    updateBox();
    const timer = setTimeout(updateBox, 50);
    window.addEventListener("resize", updateBox);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateBox);
    };
  }, [updateBox, state.present]);

  // Resize pointer down
  const handleResizePointerDown = (handle: HandleType, e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    if (!box || !selectedId) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture error
    }

    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW: box.width,
      startH: box.height,
      currentW: box.width,
      currentH: box.height,
    };
    setIsResizing(true);
    setDimensions({ width: Math.round(box.width), height: Math.round(box.height) });
  };

  // Resize move & up effect
  useEffect(() => {
    if (!isResizing || !selectedId || !artboardRef.current) return;

    const onPointerMove = (e: PointerEvent) => {
      const r = resizeRef.current;
      if (!r) return;

      const dx = (e.clientX - r.startX) / scale;
      const dy = (e.clientY - r.startY) / scale;

      const minSize = selectedId === "root" ? 100 : 1;

      let newW = r.startW;
      let newH = r.startH;

      switch (r.handle) {
        case "se":
          newW = Math.max(minSize, r.startW + dx);
          newH = Math.max(minSize, r.startH + dy);
          break;
        case "e":
          newW = Math.max(minSize, r.startW + dx);
          break;
        case "s":
          newH = Math.max(minSize, r.startH + dy);
          break;
        case "w":
          newW = Math.max(minSize, r.startW - dx);
          break;
        case "n":
          newH = Math.max(minSize, r.startH - dy);
          break;
        case "nw":
          newW = Math.max(minSize, r.startW - dx);
          newH = Math.max(minSize, r.startH - dy);
          break;
        case "ne":
          newW = Math.max(minSize, r.startW + dx);
          newH = Math.max(minSize, r.startH - dy);
          break;
        case "sw":
          newW = Math.max(minSize, r.startW - dx);
          newH = Math.max(minSize, r.startH + dy);
          break;
      }

      r.currentW = newW;
      r.currentH = newH;
      setDimensions({ width: Math.round(newW), height: Math.round(newH) });

      if (artboardRef.current) {
        const domEl = artboardRef.current.querySelector(`[data-el-id="${selectedId}"]`) as HTMLElement | null;
        if (domEl) {
          if (r.handle.includes("e") || r.handle.includes("w")) {
            domEl.style.width = `${Math.round(newW)}px`;
            domEl.style.minWidth = "0px";
          }
          if (r.handle.includes("s") || r.handle.includes("n")) {
            domEl.style.height = `${Math.round(newH)}px`;
            domEl.style.minHeight = "0px";
          }
        }
      }

      if (boxElRef.current) {
        boxElRef.current.style.width = `${Math.round(newW)}px`;
        boxElRef.current.style.height = `${Math.round(newH)}px`;
      }
    };

    const onPointerUp = () => {
      const r = resizeRef.current;
      resizeRef.current = null;
      setIsResizing(false);
      setDimensions(null);

      if (r) {
        const styles: Record<string, string> = {};
        if (r.handle.includes("e") || r.handle.includes("w")) {
          styles.width = `${Math.round(r.currentW)}px`;
          styles["min-width"] = "";
        }
        if (r.handle.includes("s") || r.handle.includes("n")) {
          styles.height = `${Math.round(r.currentH)}px`;
          styles["min-height"] = "";
        }

        dispatch({ type: "UPDATE_STYLES", id: selectedId, styles });
      }
      setTimeout(updateBox, 30);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isResizing, selectedId, scale, artboardRef, updateBox, dispatch]);

  // Drag pointer down
  const handleDragPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    if (!box || !selectedId) return;

    if (artboardRef.current?.querySelector(".canvas-inline-editor")) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture error
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: box.x,
      initialY: box.y,
      curX: box.x,
      curY: box.y,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId || !artboardRef.current) return;
    const domEl = artboardRef.current.querySelector(`[data-el-id="${selectedId}"]`) as HTMLElement | null;
    if (domEl) {
      domEl.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    }
  };

  // Drag move & up effect
  useEffect(() => {
    if (!isDragging || !selectedId || !artboardRef.current) return;

    const onPointerMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !box) return;

      const dx = (e.clientX - d.startX) / scale;
      const dy = (e.clientY - d.startY) / scale;

      if (!d.hasMoved && Math.hypot(dx, dy) > 2) {
        d.hasMoved = true;
      }

      let targetX = d.initialX + dx;
      let targetY = d.initialY + dy;
      const elW = box.width;
      const elH = box.height;

      if (!artboardRef.current) return;
      const artRect = artboardRef.current.getBoundingClientRect();
      const artWidth = artRect.width / scale;
      const artHeight = artRect.height / scale;

      const selectedModel = findElement(state.present.root, selectedId);
      const isAbsolute = selectedModel?.styles.position === "absolute";
      const parentModel = findParent(state.present.root, selectedId);

      // Parent container bounding box relative to artboard
      let parentBox = { x: 0, y: 0, width: artWidth, height: artHeight };
      if (parentModel) {
        const pDom = artboardRef.current.querySelector(`[data-el-id="${parentModel.id}"]`) as HTMLElement | null;
        if (pDom) {
          const pRect = pDom.getBoundingClientRect();
          parentBox = {
            x: (pRect.left - artRect.left) / scale,
            y: (pRect.top - artRect.top) / scale,
            width: pRect.width / scale,
            height: pRect.height / scale,
          };
        }
      }

      const activeGuides: GuideLine[] = [];
      const activeDistances: DistanceBadge[] = [];
      const snapThreshold = 6;
      const enableSnap = state.present.settings.smartSnap !== false;

      if (enableSnap) {
        const centerX = targetX + elW / 2;
        const centerY = targetY + elH / 2;

        // 1. Snap to Manual Guides from visible GuideSets
        const guideSets = state.present.guideSets || [];
        for (const set of guideSets) {
          if (!set.visible || !set.snapEnabled) continue;
          const scopeOffsetX = set.scope === "global" ? 0 : parentBox.x;
          const scopeOffsetY = set.scope === "global" ? 0 : parentBox.y;

          for (const g of set.guides) {
            if (g.type === "x") {
              const guideArtX = scopeOffsetX + g.pos;
              if (Math.abs(targetX - guideArtX) < snapThreshold) {
                targetX = guideArtX;
                activeGuides.push({ type: "x", pos: guideArtX, color: set.color });
              } else if (Math.abs(targetX + elW - guideArtX) < snapThreshold) {
                targetX = guideArtX - elW;
                activeGuides.push({ type: "x", pos: guideArtX, color: set.color });
              } else if (Math.abs(centerX - guideArtX) < snapThreshold) {
                targetX = guideArtX - elW / 2;
                activeGuides.push({ type: "x", pos: guideArtX, color: set.color });
              }
            } else if (g.type === "y") {
              const guideArtY = scopeOffsetY + g.pos;
              if (Math.abs(targetY - guideArtY) < snapThreshold) {
                targetY = guideArtY;
                activeGuides.push({ type: "y", pos: guideArtY, color: set.color });
              } else if (Math.abs(targetY + elH - guideArtY) < snapThreshold) {
                targetY = guideArtY - elH;
                activeGuides.push({ type: "y", pos: guideArtY, color: set.color });
              } else if (Math.abs(centerY - guideArtY) < snapThreshold) {
                targetY = guideArtY - elH / 2;
                activeGuides.push({ type: "y", pos: guideArtY, color: set.color });
              }
            }
          }

          // 2. Snap to Grid
          if (set.grid && set.grid.enabled && set.grid.snap && set.grid.size > 0) {
            const sz = set.grid.size;
            const nearestX = Math.round(targetX / sz) * sz;
            const nearestY = Math.round(targetY / sz) * sz;
            if (Math.abs(targetX - nearestX) < snapThreshold) {
              targetX = nearestX;
              activeGuides.push({ type: "x", pos: nearestX, color: set.color });
            }
            if (Math.abs(targetY - nearestY) < snapThreshold) {
              targetY = nearestY;
              activeGuides.push({ type: "y", pos: nearestY, color: set.color });
            }
          }
        }

        // 3. Snap to Parent Container Edges & Center
        if (Math.abs(targetX - parentBox.x) < snapThreshold) {
          targetX = parentBox.x;
          activeGuides.push({ type: "x", pos: parentBox.x });
        }
        const parentCenterX = parentBox.x + parentBox.width / 2;
        if (Math.abs(targetX + elW / 2 - parentCenterX) < snapThreshold) {
          targetX = parentCenterX - elW / 2;
          activeGuides.push({ type: "x", pos: parentCenterX });
        }
        if (Math.abs(targetX + elW - (parentBox.x + parentBox.width)) < snapThreshold) {
          targetX = parentBox.x + parentBox.width - elW;
          activeGuides.push({ type: "x", pos: parentBox.x + parentBox.width });
        }
        if (Math.abs(targetY - parentBox.y) < snapThreshold) {
          targetY = parentBox.y;
          activeGuides.push({ type: "y", pos: parentBox.y });
        }
        const parentMiddleY = parentBox.y + parentBox.height / 2;
        if (Math.abs(targetY + elH / 2 - parentMiddleY) < snapThreshold) {
          targetY = parentMiddleY - elH / 2;
          activeGuides.push({ type: "y", pos: parentMiddleY });
        }
        if (Math.abs(targetY + elH - (parentBox.y + parentBox.height)) < snapThreshold) {
          targetY = parentBox.y + parentBox.height - elH;
          activeGuides.push({ type: "y", pos: parentBox.y + parentBox.height });
        }

        // 4. Snap to Sibling Elements
        if (parentModel) {
          for (const sib of parentModel.children) {
            if (sib.id === selectedId) continue;
            const sibDom = artboardRef.current.querySelector(`[data-el-id="${sib.id}"]`) as HTMLElement | null;
            if (!sibDom) continue;

            const sRect = sibDom.getBoundingClientRect();
            const sibX = (sRect.left - artRect.left) / scale;
            const sibY = (sRect.top - artRect.top) / scale;
            const sibW = sRect.width / scale;
            const sibH = sRect.height / scale;

            if (Math.abs(targetX - sibX) < snapThreshold) {
              targetX = sibX;
              activeGuides.push({ type: "x", pos: sibX });
            } else if (Math.abs(targetX + elW - (sibX + sibW)) < snapThreshold) {
              targetX = sibX + sibW - elW;
              activeGuides.push({ type: "x", pos: sibX + sibW });
            } else if (Math.abs(targetX + elW - sibX) < snapThreshold) {
              targetX = sibX - elW;
              activeGuides.push({ type: "x", pos: sibX });
            } else if (Math.abs(targetX - (sibX + sibW)) < snapThreshold) {
              targetX = sibX + sibW;
              activeGuides.push({ type: "x", pos: sibX + sibW });
            }

            if (Math.abs(targetY - sibY) < snapThreshold) {
              targetY = sibY;
              activeGuides.push({ type: "y", pos: sibY });
            } else if (Math.abs(targetY + elH - (sibY + sibH)) < snapThreshold) {
              targetY = sibY + sibH - elH;
              activeGuides.push({ type: "y", pos: sibY + sibH });
            } else if (Math.abs(targetY + elH - sibY) < snapThreshold) {
              targetY = sibY - elH;
              activeGuides.push({ type: "y", pos: sibY });
            } else if (Math.abs(targetY - (sibY + sibH)) < snapThreshold) {
              targetY = sibY + sibH;
              activeGuides.push({ type: "y", pos: sibY + sibH });
            }
          }
        }

        // 5. Distance Measurement Badges
        const dLeft = Math.round(targetX - parentBox.x);
        const dTop = Math.round(targetY - parentBox.y);
        const dRight = Math.round(parentBox.x + parentBox.width - (targetX + elW));
        const dBottom = Math.round(parentBox.y + parentBox.height - (targetY + elH));

        if (dLeft > 0 && dLeft < 200) {
          activeDistances.push({
            id: "dist-left",
            x: parentBox.x,
            y: targetY + elH / 2,
            width: dLeft,
            value: dLeft,
            orientation: "horizontal",
          });
        }
        if (dTop > 0 && dTop < 200) {
          activeDistances.push({
            id: "dist-top",
            x: targetX + elW / 2,
            y: parentBox.y,
            height: dTop,
            value: dTop,
            orientation: "vertical",
          });
        }
        if (dRight > 0 && dRight < 200) {
          activeDistances.push({
            id: "dist-right",
            x: targetX + elW,
            y: targetY + elH / 2,
            width: dRight,
            value: dRight,
            orientation: "horizontal",
          });
        }
        if (dBottom > 0 && dBottom < 200) {
          activeDistances.push({
            id: "dist-bottom",
            x: targetX + elW / 2,
            y: targetY + elH,
            height: dBottom,
            value: dBottom,
            orientation: "vertical",
          });
        }
      }

      d.curX = targetX;
      d.curY = targetY;

      // 60fps GPU acceleration of both box overlay AND actual element
      if (boxElRef.current) {
        boxElRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`;
      }

      if (d.hasMoved && artboardRef.current) {
        const domEl = artboardRef.current.querySelector(`[data-el-id="${selectedId}"]`) as HTMLElement | null;
        if (domEl) {
          const moveX = Math.round(targetX - box.x);
          const moveY = Math.round(targetY - box.y);
          domEl.style.transform = `translate(${moveX}px, ${moveY}px)`;
          domEl.style.zIndex = "999";
          domEl.style.opacity = "0.85";
        }
      }

      setGuides(activeGuides);
      setDistances(activeDistances);

      // Flow mode drop indicator
      if (!isAbsolute) {
        const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
        let targetEl: HTMLElement | null = null;
        for (const el of elementsUnder) {
          const elId = el.getAttribute("data-el-id");
          if (elId && elId !== selectedId && !isDescendant(state.present.root, selectedId, elId)) {
            targetEl = el as HTMLElement;
            break;
          }
        }
        if (!targetEl) {
          targetEl = artboardRef.current.querySelector('[data-el-id="root"]') as HTMLElement | null;
        }
        if (targetEl) {
          const targetId = targetEl.getAttribute("data-el-id") || "root";
          const targetModel = findElement(state.present.root, targetId);
          if (targetModel) {
            const isFlexRow = targetModel.styles.display === "flex" && targetModel.styles["flex-direction"] !== "column";
            const tRect = targetEl.getBoundingClientRect();
            let insertIndex = targetModel.children.length;
            let lineRect = {
              x: (tRect.left - artRect.left) / scale,
              y: (tRect.top - artRect.top) / scale,
              width: tRect.width / scale,
              height: 2,
            };
            const children = Array.from(targetEl.children).filter((c) => c.getAttribute("data-el-id")) as HTMLElement[];
            for (let i = 0; i < children.length; i++) {
              const childDom = children[i];
              if (childDom.getAttribute("data-el-id") === selectedId) continue;
              const cRect = childDom.getBoundingClientRect();
              if (isFlexRow) {
                if (e.clientX < cRect.left + cRect.width / 2) {
                  insertIndex = i;
                  lineRect = {
                    x: (cRect.left - artRect.left) / scale - 2,
                    y: (cRect.top - artRect.top) / scale,
                    width: 3,
                    height: cRect.height / scale,
                  };
                  break;
                }
              } else {
                if (e.clientY < cRect.top + cRect.height / 2) {
                  insertIndex = i;
                  lineRect = {
                    x: (cRect.left - artRect.left) / scale,
                    y: (cRect.top - artRect.top) / scale - 2,
                    width: cRect.width / scale,
                    height: 3,
                  };
                  break;
                }
              }
            }
            setDropIndicator({
              parentId: targetId,
              index: insertIndex,
              rect: lineRect,
              orientation: isFlexRow ? "vertical" : "horizontal",
            });
          }
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setIsDragging(false);

      // Clean up live DOM styles
      if (artboardRef.current) {
        const domEl = artboardRef.current.querySelector(`[data-el-id="${selectedId}"]`) as HTMLElement | null;
        if (domEl) {
          domEl.style.transform = "";
          domEl.style.zIndex = "";
          domEl.style.opacity = "";
        }
      }

      const selectedModel = findElement(state.present.root, selectedId);
      const isAbsolute = selectedModel?.styles.position === "absolute";

      if (d && d.hasMoved) {
        if (dropIndicator && !isAbsolute) {
          dispatch({
            type: "MOVE_ELEMENT",
            id: selectedId,
            newParentId: dropIndicator.parentId,
            index: dropIndicator.index,
          });
        } else if (artboardRef.current) {
          const artRect = artboardRef.current.getBoundingClientRect();
          const parentModel = findParent(state.present.root, selectedId);
          let parentLeft = 0;
          let parentTop = 0;

          if (parentModel) {
            const pDom = artboardRef.current.querySelector(`[data-el-id="${parentModel.id}"]`) as HTMLElement | null;
            if (pDom) {
              const pRect = pDom.getBoundingClientRect();
              parentLeft = (pRect.left - artRect.left) / scale;
              parentTop = (pRect.top - artRect.top) / scale;
            }
          }

          const finalRelX = Math.round(d.curX - parentLeft);
          const finalRelY = Math.round(d.curY - parentTop);

          const styles: Record<string, string> = {
            position: "absolute",
            left: `${finalRelX}px`,
            top: `${finalRelY}px`,
            right: "",
            bottom: "",
          };

          dispatch({
            type: "UPDATE_STYLES",
            id: selectedId,
            styles,
          });
        }
      } else {
        // Tap without movement: check if clicking on child element
        const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
        for (const el of elementsUnder) {
          const elId = el.getAttribute("data-el-id");
          if (elId && elId !== selectedId && isDescendant(state.present.root, selectedId, elId)) {
            dispatch({ type: "SELECT", id: elId });
            break;
          }
        }
      }

      setGuides([]);
      setDistances([]);
      setDropIndicator(null);
      setTimeout(updateBox, 30);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging, selectedId, scale, box, state.present, dropIndicator, artboardRef, updateBox, dispatch]);

  if (!box || !selectedId || selectedId === "root") return null;

  const selectedElement = findElement(state.present.root, selectedId);
  if (!selectedElement) return null;

  const currentW = dimensions ? dimensions.width : Math.round(box.width);
  const currentH = dimensions ? dimensions.height : Math.round(box.height);
  const isAbsolute = selectedElement.styles.position === "absolute";

  const showHorizontalEdgeHandles = box.height >= 48;
  const showVerticalEdgeHandles = box.width >= 48;
  const showCornerHandles = box.width >= 20 || box.height >= 20;

  const isNearBottom = box.y + box.height + 65 > artboardHeight;

  return (
    <div className="canvas-overlay-root">
      {/* Smart Alignment Guides (Snap lines) */}
      {guides.map((g, idx) => (
        <div
          key={idx}
          className={`smart-guide-line smart-guide-line--${g.type}`}
          style={
            g.type === "x"
              ? { left: `${g.pos}px`, backgroundColor: g.color || "#ec4899" }
              : { top: `${g.pos}px`, backgroundColor: g.color || "#ec4899" }
          }
        />
      ))}

      {/* Distance Measurement Callout Badges */}
      {distances.map((d) => (
        <div
          key={d.id}
          className={`distance-guide-line distance-guide-line--${d.orientation === "horizontal" ? "h" : "v"}`}
          style={{
            left: `${d.x}px`,
            top: `${d.y}px`,
            width: d.width !== undefined ? `${d.width}px` : undefined,
            height: d.height !== undefined ? `${d.height}px` : undefined,
          }}
        >
          <span className="distance-badge">{d.value}px</span>
        </div>
      ))}

      {/* Drop Target Insertion Indicator */}
      {dropIndicator && (
        <div
          className={`drop-indicator-line drop-indicator--${dropIndicator.orientation}`}
          style={{
            left: `${dropIndicator.rect.x}px`,
            top: `${dropIndicator.rect.y}px`,
            width: `${dropIndicator.rect.width}px`,
            height: `${dropIndicator.rect.height}px`,
          }}
        >
          <span className="drop-indicator-dot drop-indicator-dot--start" />
          <span className="drop-indicator-dot drop-indicator-dot--end" />
        </div>
      )}

      {/* Selected Element Bounding Box */}
      <div
        ref={boxElRef}
        className={`selection-bounding-box ${isDragging ? "is-dragging" : ""}`}
        style={{
          transform: `translate(${box.x}px, ${box.y}px)`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        }}
        onPointerDown={handleDragPointerDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Full surface drag hit-area */}
        <div className="selection-drag-surface" onPointerDown={handleDragPointerDown} />

        {/* Floating Top Badge */}
        <div
          className="selection-badge"
          onPointerDown={handleDragPointerDown}
          title={isAbsolute ? "Posicionamento Livre" : "Posicionamento em Fluxo"}
        >
          <span className="selection-badge-name">{selectedElement.name}</span>
        </div>

        {/* Canva Move Button - Pure circular move handle directly below the element */}
        <div className={`selection-move-anchor ${isNearBottom ? "selection-move-anchor--top" : "selection-move-anchor--bottom"}`}>
          <div className="selection-move-stem" />
          <div
            className={`selection-move-btn ${isDragging ? "is-dragging" : ""}`}
            onPointerDown={handleDragPointerDown}
            title="Mover elemento (Segure e arraste)"
            aria-label="Mover elemento"
          >
            <Icon name="move" size={16} />
          </div>
        </div>

        {/* Live Resizing Tooltip */}
        {isResizing && dimensions && (
          <div className="selection-dimension-tooltip">
            {currentW} × {currentH} px
          </div>
        )}

        {/* Corner Resize Handles */}
        {showCornerHandles ? (
          <>
            <div
              className="resize-handle resize-handle--nw"
              onPointerDown={(e) => handleResizePointerDown("nw", e)}
            />
            <div
              className="resize-handle resize-handle--ne"
              onPointerDown={(e) => handleResizePointerDown("ne", e)}
            />
            <div
              className="resize-handle resize-handle--se"
              onPointerDown={(e) => handleResizePointerDown("se", e)}
            />
            <div
              className="resize-handle resize-handle--sw"
              onPointerDown={(e) => handleResizePointerDown("sw", e)}
            />
          </>
        ) : (
          <div
            className="resize-handle resize-handle--se"
            onPointerDown={(e) => handleResizePointerDown("se", e)}
          />
        )}

        {/* Edge Resize Handles - only shown when element is large enough to not crowd */}
        {showVerticalEdgeHandles && (
          <>
            <div
              className="resize-handle-edge resize-handle--n"
              onPointerDown={(e) => handleResizePointerDown("n", e)}
            />
            <div
              className="resize-handle-edge resize-handle--s"
              onPointerDown={(e) => handleResizePointerDown("s", e)}
            />
          </>
        )}
        {showHorizontalEdgeHandles && (
          <>
            <div
              className="resize-handle-edge resize-handle--w"
              onPointerDown={(e) => handleResizePointerDown("w", e)}
            />
            <div
              className="resize-handle-edge resize-handle--e"
              onPointerDown={(e) => handleResizePointerDown("e", e)}
            />
          </>
        )}
      </div>
    </div>
  );
}
