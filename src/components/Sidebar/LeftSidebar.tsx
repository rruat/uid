import React from "react";
import { Icon } from "../Icon";
import { AddPanel } from "../BottomSheet/AddPanel";
import { ElementTree } from "../Tree/ElementTree";
import { GuidesPanel } from "../BottomSheet/GuidesPanel";
import { ProjectPanel } from "../BottomSheet/ProjectPanel";
import "./leftSidebar.css";

export type SidebarTab = "elements" | "layers" | "guides" | "project" | null;

interface LeftSidebarProps {
  activeTab: SidebarTab;
  setActiveTab: React.Dispatch<React.SetStateAction<SidebarTab>>;
}

export function LeftSidebar({ activeTab, setActiveTab }: LeftSidebarProps) {
  const toggleTab = (tab: SidebarTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <aside className="canva-sidebar-root">
      {/* Icon Navigation Rail */}
      <nav className="canva-nav-rail" aria-label="Navegação lateral">
        <button
          type="button"
          className={`canva-rail-btn ${activeTab === "elements" ? "is-active" : ""}`}
          onClick={() => toggleTab("elements")}
          title="Elementos"
        >
          <div className="canva-rail-icon">
            <Icon name="plus" size={20} />
          </div>
          <span className="canva-rail-label">Elementos</span>
        </button>

        <button
          type="button"
          className={`canva-rail-btn ${activeTab === "layers" ? "is-active" : ""}`}
          onClick={() => toggleTab("layers")}
          title="Camadas"
        >
          <div className="canva-rail-icon">
            <Icon name="layers" size={20} />
          </div>
          <span className="canva-rail-label">Camadas</span>
        </button>

        <button
          type="button"
          className={`canva-rail-btn ${activeTab === "guides" ? "is-active" : ""}`}
          onClick={() => toggleTab("guides")}
          title="Réguas, Grades & Guias"
        >
          <div className="canva-rail-icon">
            <Icon name="ruler" size={20} />
          </div>
          <span className="canva-rail-label">Guias</span>
        </button>

        <button
          type="button"
          className={`canva-rail-btn ${activeTab === "project" ? "is-active" : ""}`}
          onClick={() => toggleTab("project")}
          title="Projeto"
        >
          <div className="canva-rail-icon">
            <Icon name="folderOpen" size={20} />
          </div>
          <span className="canva-rail-label">Projeto</span>
        </button>
      </nav>

      {/* Backdrop overlay for mobile drawer */}
      {activeTab && (
        <div
          className="canva-drawer-backdrop"
          onClick={() => setActiveTab(null)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer Panel (Desktop side drawer / Mobile bottom sheet) */}
      {activeTab && (
        <div className="canva-drawer" role="dialog" aria-modal="true">
          {/* Top handle pill for mobile bottom sheet */}
          <div className="canva-drawer__handle" />

          <div className="canva-drawer__header">
            <span className="canva-drawer__title">
              {activeTab === "elements" && "Adicionar Elementos"}
              {activeTab === "layers" && "Estrutura & Camadas"}
              {activeTab === "guides" && "Réguas, Grades & Guias"}
              {activeTab === "project" && "Gerenciar Projeto"}
            </span>
            <button
              type="button"
              className="canva-drawer__close-btn"
              onClick={() => setActiveTab(null)}
              title="Fechar painel"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="canva-drawer__body ui-scrollbar-hidden">
            {activeTab === "elements" && (
              <AddPanel
                onElementAdded={() => {
                  if (typeof window !== "undefined" && window.innerWidth <= 768) {
                    setActiveTab(null);
                  }
                }}
              />
            )}
            {activeTab === "layers" && <ElementTree onClose={() => setActiveTab(null)} isEmbedded />}
            {activeTab === "guides" && <GuidesPanel />}
            {activeTab === "project" && <ProjectPanel />}
          </div>
        </div>
      )}
    </aside>
  );
}
