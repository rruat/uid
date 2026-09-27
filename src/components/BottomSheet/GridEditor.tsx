import { useEffect, useState } from "react";
import {
  buildTracksValue,
  collectAreaNames,
  countTracks,
  parseAreas,
  resizeMatrix,
  serializeAreas,
} from "../../model/gridUtils";
import type { CSSProperties } from "../../model/types";
import { useProject } from "../../state/ProjectContext";
import { UnitField } from "./StyleField";

const MAX_TRACKS = 8;

/**
 * Visual editor for a grid container: column/row count steppers plus an
 * editable matrix of named cells that becomes `grid-template-areas`.
 * Naming the same cell text in adjacent cells merges them into one area —
 * that name is what a grid child's own "grid-area" field should match.
 */
export function GridEditor({ id, styles }: { id: string; styles: CSSProperties }) {
  const { dispatch } = useProject();
  const commit = (patch: CSSProperties) => dispatch({ type: "UPDATE_STYLES", id, styles: patch });

  const deriveFromStyles = () => {
    const c = countTracks(styles["grid-template-columns"], 2);
    const r = countTracks(styles["grid-template-rows"], 2);
    return { cols: c, rows: r, matrix: resizeMatrix(parseAreas(styles["grid-template-areas"]), r, c) };
  };

  const [{ cols, rows, matrix }, setLocal] = useState(deriveFromStyles);

  useEffect(() => {
    setLocal(deriveFromStyles());
    // Resync only when switching to a different element, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const applyGrid = (nextRows: number, nextCols: number, nextMatrix: string[][]) => {
    commit({
      "grid-template-columns": buildTracksValue(nextCols),
      "grid-template-rows": buildTracksValue(nextRows),
      "grid-template-areas": serializeAreas(nextMatrix),
    });
  };

  const setColsCount = (next: number) => {
    const c = Math.min(MAX_TRACKS, Math.max(1, next));
    const m = resizeMatrix(matrix, rows, c);
    setLocal({ cols: c, rows, matrix: m });
    applyGrid(rows, c, m);
  };

  const setRowsCount = (next: number) => {
    const r = Math.min(MAX_TRACKS, Math.max(1, next));
    const m = resizeMatrix(matrix, r, cols);
    setLocal({ cols, rows: r, matrix: m });
    applyGrid(r, cols, m);
  };

  const updateCell = (r: number, c: number, value: string) => {
    const m = matrix.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value || "." : cell)) : row));
    setLocal({ cols, rows, matrix: m });
  };

  const commitCells = () => applyGrid(rows, cols, matrix);
  const areaNames = collectAreaNames(matrix);

  return (
    <div className="grid-editor">
      <div className="ui-row">
        <Stepper label="Colunas" value={cols} onChange={setColsCount} />
        <Stepper label="Linhas" value={rows} onChange={setRowsCount} />
      </div>

      <div className="ui-field">
        <span className="ui-label">Áreas da grade</span>
        <div className="grid-area-editor" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {matrix.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={`${r}-${c}`}
                className="grid-area-cell"
                value={cell === "." ? "" : cell}
                placeholder="—"
                onChange={(e) => updateCell(r, c, e.target.value)}
                onBlur={commitCells}
              />
            ))
          )}
        </div>
        <span className="grid-editor__hint">
          Nomeie uma célula para criar uma área; repita o nome em células vizinhas para uni-las. No
          elemento filho, use o mesmo nome no campo "Área da grade".
        </span>
        {areaNames.length > 0 && (
          <div className="ui-row" style={{ flexWrap: "wrap", gap: 6 }}>
            {areaNames.map((name) => (
              <span key={name} className="tag-badge">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="field-grid">
        <UnitField id={id} prop="row-gap" label="Row gap" value={styles["row-gap"]} />
        <UnitField id={id} prop="column-gap" label="Column gap" value={styles["column-gap"]} />
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <div className="stepper">
      <span className="ui-label">{label}</span>
      <div className="stepper__control">
        <button className="ui-btn is-icon" onClick={() => onChange(value - 1)} title={`Menos ${label.toLowerCase()}`}>
          −
        </button>
        <span className="stepper__value">{value}</span>
        <button className="ui-btn is-icon" onClick={() => onChange(value + 1)} title={`Mais ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}
