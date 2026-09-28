import { useProject } from "../../state/ProjectContext";
import { Icon } from "../Icon";
import { createId } from "../../model/id";
import type { GuideSet } from "../../model/types";
import "./guidesPanel.css";

const SET_PALETTE = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#f43f5e", // Rose
];

export function GuidesPanel() {
  const { state, dispatch } = useProject();
  const settings = state.present.settings;
  const showRulers = settings.showRulers !== false;
  const smartSnap = settings.smartSnap !== false;
  const guideSets: GuideSet[] = state.present.guideSets || [];

  const handleAddSet = () => {
    const nextIdx = guideSets.length;
    const color = SET_PALETTE[nextIdx % SET_PALETTE.length];
    const newSet: GuideSet = {
      id: createId("set"),
      name: `Conjunto ${nextIdx + 1}`,
      color,
      visible: true,
      snapEnabled: true,
      scope: state.selectedId && state.selectedId !== "root" ? state.selectedId : "global",
      grid: {
        enabled: true,
        size: 16,
        orientation: "both",
        color,
        opacity: 0.18,
        thickness: 1,
        snap: true,
      },
      guides: [
        { id: createId("guide"), type: "x", pos: 24 },
        { id: createId("guide"), type: "y", pos: 40 },
      ],
    };
    dispatch({ type: "ADD_GUIDE_SET", guideSet: newSet });
  };

  return (
    <div className="guides-panel">
      {/* Master Switches */}
      <div className="guides-master-switches">
        <button
          type="button"
          className={`guides-toggle-btn ${showRulers ? "is-active" : ""}`}
          onClick={() => dispatch({ type: "SET_SHOW_RULERS", show: !showRulers })}
          title="Ativar/Desativar Réguas no topo e na lateral do canvas"
        >
          <Icon name="ruler" size={17} />
          <span>{showRulers ? "Réguas Ativas" : "Réguas Ocultas"}</span>
        </button>

        <button
          type="button"
          className={`guides-toggle-btn ${smartSnap ? "is-active" : ""}`}
          onClick={() => dispatch({ type: "SET_SMART_SNAP", snap: !smartSnap })}
          title="Ativar/Desativar Alinhamento Magnético inteligente"
        >
          <Icon name="magnet" size={17} />
          <span>{smartSnap ? "Snap Magnético" : "Snap Desativado"}</span>
        </button>
      </div>

      {/* Guide Sets Section */}
      <div className="guides-sets-header">
        <span className="guides-sets-title">Conjuntos de Réguas & Grades ({guideSets.length})</span>
        <button
          type="button"
          className="ui-btn is-primary"
          style={{ height: 30, padding: "0 10px", fontSize: 12 }}
          onClick={handleAddSet}
        >
          <Icon name="plus" size={14} />
          <span>Novo Conjunto</span>
        </button>
      </div>

      {guideSets.map((set) => {
        return (
          <div
            key={set.id}
            className={`guide-set-card ${!set.visible ? "is-inactive" : ""}`}
            style={{ borderLeftColor: set.color, borderLeftWidth: 4 }}
          >
            {/* Set Header */}
            <div className="guide-set-card__header">
              <input
                type="color"
                className="guide-set-color-chip"
                value={set.color.startsWith("#") ? set.color : "#6366f1"}
                title="Mudar cor deste conjunto"
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_GUIDE_SET",
                    id: set.id,
                    patch: { color: e.target.value },
                  })
                }
              />

              <input
                className="guide-set-name-input"
                value={set.name}
                title="Renomear conjunto"
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_GUIDE_SET",
                    id: set.id,
                    patch: { name: e.target.value },
                  })
                }
              />

              <div className="guide-set-card__actions">
                <button
                  type="button"
                  className={`ui-btn is-icon ${set.snapEnabled ? "is-active" : ""}`}
                  style={{ width: 30, height: 30 }}
                  title={set.snapEnabled ? "Snap deste conjunto ativo" : "Snap deste conjunto inativo"}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_GUIDE_SET",
                      id: set.id,
                      patch: { snapEnabled: !set.snapEnabled },
                    })
                  }
                >
                  <Icon name="magnet" size={15} />
                </button>

                <button
                  type="button"
                  className={`ui-btn is-icon ${set.visible ? "is-active" : ""}`}
                  style={{ width: 30, height: 30 }}
                  title={set.visible ? "Ocultar conjunto" : "Exibir conjunto"}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_GUIDE_SET",
                      id: set.id,
                      patch: { visible: !set.visible },
                    })
                  }
                >
                  <Icon name={set.visible ? "eye" : "eyeOff"} size={15} />
                </button>

                {guideSets.length > 1 && (
                  <button
                    type="button"
                    className="ui-btn is-icon"
                    style={{ width: 30, height: 30 }}
                    title="Excluir conjunto"
                    onClick={() => dispatch({ type: "REMOVE_GUIDE_SET", id: set.id })}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scope Selection */}
            <div className="guide-subsection__row">
              <span className="ui-label">Escopo de aplicação</span>
              <select
                className="guide-scope-select"
                value={set.scope}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_GUIDE_SET",
                    id: set.id,
                    patch: { scope: e.target.value },
                  })
                }
              >
                <option value="global">Global (Toda a Página)</option>
                {state.selectedId && state.selectedId !== "root" && (
                  <option value={state.selectedId}>Elemento Selecionado ({state.selectedId})</option>
                )}
              </select>
            </div>

            {/* Grid Section */}
            <div className="guide-subsection">
              <div className="guide-subsection__row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="grid" size={15} />
                  <span className="ui-label" style={{ margin: 0 }}>Grade Visual</span>
                </div>
                <button
                  type="button"
                  className={`ui-btn ${set.grid.enabled ? "is-active" : ""}`}
                  style={{ height: 26, padding: "0 8px", fontSize: 11 }}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_GUIDE_SET",
                      id: set.id,
                      patch: {
                        grid: { ...set.grid, enabled: !set.grid.enabled },
                      },
                    })
                  }
                >
                  {set.grid.enabled ? "Ativada" : "Desativada"}
                </button>
              </div>

              {set.grid.enabled && (
                <>
                  <div className="guide-subsection__row">
                    <span className="ui-label" style={{ margin: 0 }}>Tamanho</span>
                    <div className="guide-presets-row">
                      {[8, 16, 24, 32].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`guide-preset-pill ${set.grid.size === sz ? "is-active" : ""}`}
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_GUIDE_SET",
                              id: set.id,
                              patch: { grid: { ...set.grid, size: sz } },
                            })
                          }
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="guide-subsection__row">
                    <span className="ui-label" style={{ margin: 0 }}>Orientação</span>
                    <div className="guide-presets-row">
                      {(["both", "horizontal", "vertical"] as const).map((orient) => (
                        <button
                          key={orient}
                          type="button"
                          className={`guide-preset-pill ${set.grid.orientation === orient ? "is-active" : ""}`}
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_GUIDE_SET",
                              id: set.id,
                              patch: { grid: { ...set.grid, orientation: orient } },
                            })
                          }
                        >
                          {orient === "both" ? "Ambas" : orient === "horizontal" ? "Horiz" : "Vert"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="guide-subsection__row">
                    <span className="ui-label" style={{ margin: 0 }}>Snap à grade</span>
                    <button
                      type="button"
                      className={`guide-preset-pill ${set.grid.snap ? "is-active" : ""}`}
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_GUIDE_SET",
                          id: set.id,
                          patch: { grid: { ...set.grid, snap: !set.grid.snap } },
                        })
                      }
                    >
                      {set.grid.snap ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Manual Guides Section */}
            <div className="guide-subsection">
              <div className="guide-subsection__row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="ruler" size={15} />
                  <span className="ui-label" style={{ margin: 0 }}>Guias Manuais ({set.guides.length})</span>
                </div>

                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    className="ui-btn"
                    style={{ height: 26, padding: "0 6px", fontSize: 11 }}
                    title="Adicionar Linha Vertical"
                    onClick={() =>
                      dispatch({
                        type: "ADD_CUSTOM_GUIDE",
                        guideSetId: set.id,
                        guide: {
                          id: createId("guide"),
                          type: "x",
                          pos: 32,
                        },
                      })
                    }
                  >
                    + Vertical (X)
                  </button>
                  <button
                    type="button"
                    className="ui-btn"
                    style={{ height: 26, padding: "0 6px", fontSize: 11 }}
                    title="Adicionar Linha Horizontal"
                    onClick={() =>
                      dispatch({
                        type: "ADD_CUSTOM_GUIDE",
                        guideSetId: set.id,
                        guide: {
                          id: createId("guide"),
                          type: "y",
                          pos: 32,
                        },
                      })
                    }
                  >
                    + Horiz (Y)
                  </button>
                </div>
              </div>

              {set.guides.length > 0 && (
                <div className="manual-guides-list">
                  {set.guides.map((g) => (
                    <div key={g.id} className="manual-guide-row">
                      <span className="manual-guide-tag">{g.type.toUpperCase()}:</span>
                      <div className="manual-guide-stepper">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_CUSTOM_GUIDE",
                              guideSetId: set.id,
                              guideId: g.id,
                              pos: Math.max(0, g.pos - 8),
                            })
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={g.pos}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_CUSTOM_GUIDE",
                              guideSetId: set.id,
                              guideId: g.id,
                              pos: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_CUSTOM_GUIDE",
                              guideSetId: set.id,
                              guideId: g.id,
                              pos: g.pos + 8,
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>px</span>
                      <button
                        type="button"
                        className="ui-btn is-icon"
                        style={{ width: 24, height: 24, padding: 0 }}
                        title="Remover guia"
                        onClick={() =>
                          dispatch({
                            type: "REMOVE_CUSTOM_GUIDE",
                            guideSetId: set.id,
                            guideId: g.id,
                          })
                        }
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
