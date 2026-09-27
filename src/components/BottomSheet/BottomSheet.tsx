import { useEffect, useRef, useState } from "react";
import { findElement } from "../../model/document";
import { useProject } from "../../state/ProjectContext";
import { Icon } from "../Icon";
import { AddPanel } from "./AddPanel";
import { ProjectPanel } from "./ProjectPanel";
import { PropertiesPanel, getPropertiesTabs } from "./PropertiesPanel";
import type { TabKey } from "./PropertiesPanel";
import "./bottomSheet.css";

type SheetState = "collapsed" | "half" | "expanded";
type HomeTab = "adicionar" | "projeto";

const COLLAPSED_HEIGHT = 56;

export function BottomSheet() {
  const { state } = useProject();
  const selected = state.selectedId ? findElement(state.present.root, state.selectedId) : null;

  const [sheetState, setSheetState] = useState<SheetState>("half");
  const [homeTab, setHomeTab] = useState<HomeTab>("adicionar");
  const [propsTab, setPropsTab] = useState<TabKey>("tamanho");
  const [addOverlay, setAddOverlay] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; height: number } | null>(null);
  const containerHeightRef = useRef(600);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setSheetState("half");
    setAddOverlay(false);
    setPropsTab("tamanho");
  }, [selected?.id]);

  // Switching tabs shows different fields — always start them from the top,
  // instead of leaving the scroll wherever the previous tab left it (which
  // could make the new tab's fields look cut off).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [propsTab, homeTab]);

  const heightFor = (s: SheetState) => {
    const vh = containerHeightRef.current;
    if (s === "collapsed") return COLLAPSED_HEIGHT;
    if (s === "half") return Math.round(vh * 0.42);
    return Math.round(vh * 0.85);
  };

  const onDragStart = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const parent = (e.currentTarget as HTMLElement).closest(".uid-main") as HTMLElement | null;
    if (parent) containerHeightRef.current = parent.clientHeight;
    dragStart.current = { y: e.clientY, height: heightFor(sheetState) };
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const delta = dragStart.current.y - e.clientY;
    const next = Math.min(heightFor("expanded"), Math.max(COLLAPSED_HEIGHT, dragStart.current.height + delta));
    setDragHeight(next);
  };

  const onDragEnd = () => {
    if (dragHeight === null) {
      dragStart.current = null;
      return;
    }
    const vh = containerHeightRef.current;
    const collapsedMid = (COLLAPSED_HEIGHT + heightFor("half")) / 2;
    const halfMid = (heightFor("half") + heightFor("expanded")) / 2;
    let next: SheetState = "collapsed";
    if (dragHeight > halfMid) next = "expanded";
    else if (dragHeight > collapsedMid) next = "half";
    setSheetState(next);
    setDragHeight(null);
    dragStart.current = null;
    void vh;
  };

  const currentHeight = dragHeight ?? heightFor(sheetState);
  const propsTabs = selected ? getPropertiesTabs(selected) : [];

  return (
    <div className="bottom-sheet" style={{ height: currentHeight }}>
      <div
        className="bottom-sheet__handle"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <span className="bottom-sheet__grip" />
      </div>

      <div className="bottom-sheet__scroll ui-scrollbar-hidden" ref={scrollRef}>
        {selected && addOverlay ? (
          <>
            <div className="add-overlay-header">
              <button className="ui-btn is-icon" onClick={() => setAddOverlay(false)}>
                <Icon name="x" size={16} />
              </button>
              <span className="ui-label">Adicionar dentro de: {selected.name}</span>
            </div>
            <AddPanel />
          </>
        ) : selected ? (
          <PropertiesPanel element={selected} tab={propsTab} onOpenAdd={() => setAddOverlay(true)} />
        ) : homeTab === "adicionar" ? (
          <AddPanel />
        ) : (
          <ProjectPanel />
        )}
      </div>

      {/* Fixed, non-scrolling: these are the tabs that decide what the
          scroll area above shows, so they stay reachable and legible
          instead of scrolling away (and sometimes clipping) with the
          content. */}
      {!addOverlay && (
        <div className="bottom-sheet__chips ui-scrollbar-hidden">
          {selected
            ? propsTabs.map((t) => (
                <button
                  key={t.key}
                  className={`tab-pill ${propsTab === t.key ? "is-active" : ""}`}
                  onClick={() => setPropsTab(t.key)}
                >
                  {t.label}
                </button>
              ))
            : (
                [
                  { key: "adicionar" as HomeTab, label: "Adicionar" },
                  { key: "projeto" as HomeTab, label: "Projeto" },
                ]
              ).map((t) => (
                <button
                  key={t.key}
                  className={`tab-pill ${homeTab === t.key ? "is-active" : ""}`}
                  onClick={() => setHomeTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
        </div>
      )}
    </div>
  );
}
