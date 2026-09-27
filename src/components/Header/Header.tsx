import { Icon } from "../Icon";
import { useProject } from "../../state/ProjectContext";
import type { Mode } from "../../state/projectReducer";
import "./header.css";

export function Header({ onToggleTree }: { onToggleTree: () => void }) {
  const { state, dispatch } = useProject();
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const modes: { key: Mode; icon: "square" | "code" | "eye"; label: string }[] = [
    { key: "visual", icon: "square", label: "Visual" },
    { key: "code", icon: "code", label: "Code" },
    { key: "preview", icon: "eye", label: "Preview" },
  ];

  return (
    <header className="uid-header">
      <div className="ui-row">
        <button className="ui-btn is-icon" onClick={onToggleTree} title="Estrutura">
          <Icon name="layers" size={18} />
        </button>
        <span className="uid-header__title">{state.present.name}</span>
      </div>

      <div className="ui-row">
        <div className="mode-switch">
          {modes.map((m) => (
            <button
              key={m.key}
              className={`mode-switch__btn ${state.mode === m.key ? "is-active" : ""}`}
              onClick={() => dispatch({ type: "SET_MODE", mode: m.key })}
              title={m.label}
            >
              <Icon name={m.icon} size={16} />
            </button>
          ))}
        </div>

        <button className="ui-btn is-icon" disabled={!canUndo} onClick={() => dispatch({ type: "UNDO" })} title="Desfazer">
          <Icon name="undo" size={18} />
        </button>
        <button className="ui-btn is-icon" disabled={!canRedo} onClick={() => dispatch({ type: "REDO" })} title="Refazer">
          <Icon name="redo" size={18} />
        </button>
      </div>
    </header>
  );
}
