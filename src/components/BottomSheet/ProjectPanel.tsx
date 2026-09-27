import { useState } from "react";
import { Icon } from "../Icon";
import { createDefaultDocument } from "../../model/document";
import { downloadTextFile, exportZip, generateCss, generateHtml, generateJs } from "../../model/exportProject";
import { openUixFile, saveUixFile } from "../../model/storage";
import { useProject } from "../../state/ProjectContext";
import type { UixSettings } from "../../model/types";

const VIEWPORTS: { key: UixSettings["viewport"]; icon: "smartphone" | "tablet" | "monitor"; label: string }[] = [
  { key: "mobile", icon: "smartphone", label: "Mobile" },
  { key: "tablet", icon: "tablet", label: "Tablet" },
  { key: "desktop", icon: "monitor", label: "Desktop" },
];

export function ProjectPanel() {
  const { state, dispatch } = useProject();
  const [confirmNew, setConfirmNew] = useState(false);

  return (
    <div className="project-panel">
      <label className="ui-field">
        <span className="ui-label">Nome do projeto</span>
        <input
          className="ui-input"
          value={state.present.name}
          onChange={(e) => dispatch({ type: "RENAME_PROJECT", name: e.target.value })}
        />
      </label>

      <div className="ui-field">
        <span className="ui-label">Viewport de visualização</span>
        <div className="ui-row">
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              className={`ui-btn ${state.present.settings.viewport === v.key ? "is-active" : ""}`}
              onClick={() => dispatch({ type: "SET_VIEWPORT", viewport: v.key })}
            >
              <Icon name={v.icon} size={16} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ui-field">
        <span className="ui-label">Projeto (.uix)</span>
        <div className="ui-row">
          <button className="ui-btn" onClick={() => saveUixFile(state.present)}>
            <Icon name="save" size={16} />
            Salvar
          </button>
          <button
            className="ui-btn"
            onClick={async () => {
              const doc = await openUixFile().catch(() => null);
              if (doc) dispatch({ type: "LOAD_DOCUMENT", document: doc });
            }}
          >
            <Icon name="folderOpen" size={16} />
            Abrir
          </button>
        </div>
      </div>

      <div className="ui-field">
        <span className="ui-label">Exportar</span>
        <div className="ui-row" style={{ flexWrap: "wrap" }}>
          <button className="ui-btn" onClick={() => downloadTextFile("index.html", generateHtml(state.present), "text/html")}>
            HTML
          </button>
          <button className="ui-btn" onClick={() => downloadTextFile("style.css", generateCss(state.present), "text/css")}>
            CSS
          </button>
          <button className="ui-btn" onClick={() => downloadTextFile("script.js", generateJs(state.present), "text/javascript")}>
            JS
          </button>
          <button className="ui-btn is-primary" onClick={() => exportZip(state.present)}>
            <Icon name="download" size={16} />
            ZIP
          </button>
        </div>
      </div>

      <div className="ui-field">
        <span className="ui-label">Novo projeto</span>
        {!confirmNew ? (
          <button className="ui-btn" onClick={() => setConfirmNew(true)}>
            Começar um novo projeto
          </button>
        ) : (
          <div className="ui-row">
            <button
              className="ui-btn is-primary"
              onClick={() => {
                dispatch({ type: "LOAD_DOCUMENT", document: createDefaultDocument() });
                setConfirmNew(false);
              }}
            >
              Confirmar: apagar e criar novo
            </button>
            <button className="ui-btn" onClick={() => setConfirmNew(false)}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
