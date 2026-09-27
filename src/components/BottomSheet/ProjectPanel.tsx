import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { createDefaultDocument } from "../../model/document";
import { downloadTextFile, exportZip, generateCss, generateHtml, generateJs } from "../../model/exportProject";
import {
  clearAllAppData,
  deleteProjectFromLibrary,
  listProjects,
  loadProjectFromLibrary,
  openUixFile,
  saveProjectToLibrary,
  saveUixFile,
  type ProjectSummary,
} from "../../model/storage";
import { useProject } from "../../state/ProjectContext";
import type { UixSettings } from "../../model/types";

const VIEWPORTS: { key: UixSettings["viewport"]; icon: "smartphone" | "tablet" | "monitor"; label: string }[] = [
  { key: "mobile", icon: "smartphone", label: "Mobile" },
  { key: "tablet", icon: "tablet", label: "Tablet" },
  { key: "desktop", icon: "monitor", label: "Desktop" },
];

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  return `há ${days}d`;
}

export function ProjectPanel() {
  const { state, dispatch } = useProject();
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const refreshProjects = () => {
    listProjects().then(setProjects).catch(() => void 0);
  };

  useEffect(refreshProjects, []);

  const handleSaveToLibrary = async () => {
    await saveProjectToLibrary(state.present);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    refreshProjects();
  };

  const handleOpenFromLibrary = async (id: string) => {
    const doc = await loadProjectFromLibrary(id);
    if (doc) dispatch({ type: "LOAD_DOCUMENT", document: doc });
  };

  const handleDeleteFromLibrary = async (id: string) => {
    await deleteProjectFromLibrary(id);
    setConfirmDeleteId(null);
    refreshProjects();
  };

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
        <span className="ui-label">Meus projetos (neste dispositivo)</span>
        <div className="ui-row">
          <button className="ui-btn is-primary" onClick={handleSaveToLibrary}>
            <Icon name="save" size={16} />
            {savedFlash ? "Salvo!" : "Salvar neste dispositivo"}
          </button>
        </div>

        {projects.length > 0 && (
          <div className="project-list">
            {projects.map((p) => (
              <div key={p.id} className="project-list__row">
                <button className="project-list__open" onClick={() => handleOpenFromLibrary(p.id)}>
                  <span className="project-list__name">
                    {p.name}
                    {p.id === state.present.id && <span className="tag-badge">atual</span>}
                  </span>
                  <span className="project-list__date">{formatRelativeDate(p.updatedAt)}</span>
                </button>
                {confirmDeleteId === p.id ? (
                  <div className="ui-row">
                    <button className="ui-btn is-icon" onClick={() => handleDeleteFromLibrary(p.id)} title="Confirmar exclusão">
                      <Icon name="trash" size={14} />
                    </button>
                    <button className="ui-btn is-icon" onClick={() => setConfirmDeleteId(null)} title="Cancelar">
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ) : (
                  <button className="ui-btn is-icon" onClick={() => setConfirmDeleteId(p.id)} title="Excluir">
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ui-field">
        <span className="ui-label">Arquivo .uix (portátil)</span>
        <div className="ui-row">
          <button className="ui-btn" onClick={() => saveUixFile(state.present)}>
            <Icon name="download" size={16} />
            Baixar .uix
          </button>
          <button
            className="ui-btn"
            onClick={async () => {
              const doc = await openUixFile().catch(() => null);
              if (doc) dispatch({ type: "LOAD_DOCUMENT", document: doc });
            }}
          >
            <Icon name="folderOpen" size={16} />
            Importar .uix
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

      <div className="ui-field">
        <span className="ui-label">Avançado</span>
        {!confirmReset ? (
          <button className="ui-btn" onClick={() => setConfirmReset(true)}>
            <Icon name="trash" size={16} />
            Limpar cache e todos os dados
          </button>
        ) : (
          <div className="ui-field">
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Isso desregistra o service worker do PWA, apaga o cache e todos os projetos salvos
              neste dispositivo (incluindo o autosave). Use após atualizar o app se ele ficar
              travado numa versão antiga no Android. Não afeta arquivos .uix já exportados.
            </span>
            <div className="ui-row">
              <button
                className="ui-btn"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                onClick={() => clearAllAppData().finally(() => window.location.reload())}
              >
                Confirmar: limpar tudo e recarregar
              </button>
              <button className="ui-btn" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
