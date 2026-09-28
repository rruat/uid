import { Icon } from "../Icon";
import { useProject } from "../../state/ProjectContext";
import type { Mode } from "../../state/projectReducer";
import type { Viewport } from "../../model/types";
import { exportZip } from "../../model/exportProject";
import "./header.css";

const VIEWPORTS: { key: Viewport; icon: "smartphone" | "tablet" | "monitor" | "squareDashed"; label: string }[] = [
  { key: "mobile", icon: "smartphone", label: "Mobile (390px)" },
  { key: "tablet", icon: "tablet", label: "Tablet (768px)" },
  { key: "desktop", icon: "monitor", label: "Desktop (1280px)" },
  { key: "free", icon: "squareDashed", label: "Livre" },
];

export function Header({ onToggleTree }: { onToggleTree?: () => void }) {
  const { state, dispatch } = useProject();
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const modes: { key: Mode; icon: "square" | "code" | "eye"; label: string }[] = [
    { key: "visual", icon: "square", label: "Editor Visual" },
    { key: "code", icon: "code", label: "Código HTML/CSS" },
    { key: "preview", icon: "eye", label: "Visualização Real" },
  ];

  return (
    <header className="uid-header">
      {/* Left: Brand & Document Name */}
      <div className="uid-header__left">
        {onToggleTree && (
          <button
            type="button"
            className="ui-btn is-icon"
            style={{ width: 34, height: 34 }}
            onClick={onToggleTree}
            title="Camadas e Estrutura"
          >
            <Icon name="layers" size={17} />
          </button>
        )}
        <div className="uid-header__brand">
          <span className="uid-header__logo">UID</span>
        </div>

        <input
          className="uid-header__title-input"
          value={state.present.name}
          onChange={(e) => dispatch({ type: "RENAME_PROJECT", name: e.target.value })}
          placeholder="Nome do projeto"
          title="Clique para renomear o projeto"
        />
      </div>

      {/* Center: History & Viewport Switcher */}
      <div className="uid-header__center">
        <div className="uid-header__history">
          <button
            type="button"
            className="ui-btn is-icon"
            style={{ width: 32, height: 32 }}
            disabled={!canUndo}
            onClick={() => dispatch({ type: "UNDO" })}
            title="Desfazer (Ctrl+Z)"
          >
            <Icon name="undo" size={16} />
          </button>
          <button
            type="button"
            className="ui-btn is-icon"
            style={{ width: 32, height: 32 }}
            disabled={!canRedo}
            onClick={() => dispatch({ type: "REDO" })}
            title="Refazer (Ctrl+Y)"
          >
            <Icon name="redo" size={16} />
          </button>
        </div>

        <div className="uid-header__viewports">
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={`uid-vp-btn ${state.present.settings.viewport === v.key ? "is-active" : ""}`}
              onClick={() => dispatch({ type: "SET_VIEWPORT", viewport: v.key })}
              title={v.label}
            >
              <Icon name={v.icon} size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Right: Modes & Export */}
      <div className="uid-header__right">
        <div className="mode-switch">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`mode-switch__btn ${state.mode === m.key ? "is-active" : ""}`}
              onClick={() => dispatch({ type: "SET_MODE", mode: m.key })}
              title={m.label}
            >
              <Icon name={m.icon} size={15} />
              <span className="mode-switch__label">{m.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="ui-btn is-primary"
          style={{ height: 34, padding: "0 12px", fontSize: 13, fontWeight: 600 }}
          onClick={() => exportZip(state.present)}
          title="Exportar projeto completo em ZIP (HTML + CSS + JS)"
        >
          <Icon name="download" size={15} />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
}
