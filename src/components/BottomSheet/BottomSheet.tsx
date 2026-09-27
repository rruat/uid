import { useEffect, useRef, useState } from "react";
import { findElement } from "../../model/document";
import { useProject } from "../../state/ProjectContext";
import { Icon } from "../Icon";
import { AddPanel } from "./AddPanel";
import { ProjectPanel } from "./ProjectPanel";
import { PropertiesPanel, getPropertiesTabs } from "./PropertiesPanel";
import type { TabKey } from "./PropertiesPanel";
import "./bottomSheet.css";

type HomeTab = "adicionar" | "projeto";

/**
 * The "smart bar": always visible (no drag-to-collapse/expand — a fixed
 * height instead), and pinned to the top edge of the on-screen keyboard via
 * the visualViewport API instead of the layout viewport, so a focused text
 * field never ends up hidden behind the keyboard on Android/iOS.
 */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}

export function BottomSheet() {
  const { state } = useProject();
  const selected = state.selectedId ? findElement(state.present.root, state.selectedId) : null;
  const keyboardInset = useKeyboardInset();

  const [homeTab, setHomeTab] = useState<HomeTab>("adicionar");
  const [propsTab, setPropsTab] = useState<TabKey>("tamanho");
  const [addOverlay, setAddOverlay] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAddOverlay(false);
    setPropsTab("tamanho");
  }, [selected?.id]);

  // Switching tabs shows different fields — always start them from the top,
  // instead of leaving the scroll wherever the previous tab left it (which
  // could make the new tab's fields look cut off).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [propsTab, homeTab]);

  const propsTabs = selected ? getPropertiesTabs(selected) : [];

  return (
    <div className="bottom-sheet" style={{ bottom: keyboardInset }}>
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
