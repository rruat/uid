import { useEffect, useState } from "react";
import { useProject } from "../../state/ProjectContext";
import type { CSSProperties } from "../../model/types";

function useStyleCommit(id: string) {
  const { dispatch } = useProject();
  return (patch: CSSProperties) => dispatch({ type: "UPDATE_STYLES", id, styles: patch });
}

export function TextField({
  id,
  prop,
  label,
  value,
  placeholder,
}: {
  id: string;
  prop: string;
  label: string;
  value: string | undefined;
  placeholder?: string;
}) {
  const commit = useStyleCommit(id);
  const [local, setLocal] = useState(value ?? "");

  useEffect(() => setLocal(value ?? ""), [value, id]);

  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => commit({ [prop]: local })}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </label>
  );
}

export function SelectField({
  id,
  prop,
  label,
  value,
  options,
}: {
  id: string;
  prop: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
}) {
  const commit = useStyleCommit(id);
  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <select
        className="ui-input"
        value={value ?? ""}
        onChange={(e) => commit({ [prop]: e.target.value })}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ColorField({
  id,
  prop,
  label,
  value,
}: {
  id: string;
  prop: string;
  label: string;
  value: string | undefined;
}) {
  const commit = useStyleCommit(id);
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value, id]);

  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <div className="ui-row">
        <span className="color-swatch" style={{ background: local || "transparent" }} />
        <input
          className="ui-input"
          value={local}
          placeholder="#000000"
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => commit({ [prop]: local })}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
    </label>
  );
}

const LENGTH_UNITS = ["px", "%", "rem", "em", "vw", "vh"];

interface ParsedNumber {
  mode: "number";
  number: string;
  unit: string;
}
interface ParsedKeyword {
  mode: "keyword";
  keyword: string;
}

function parseUnitValue(value: string | undefined): ParsedNumber | ParsedKeyword {
  const v = (value ?? "").trim();
  if (v === "") return { mode: "number", number: "", unit: "px" };
  const match = v.match(/^(-?\d*\.?\d+)\s*([a-zA-Z%]*)$/);
  if (match) return { mode: "number", number: match[1], unit: match[2] || "px" };
  return { mode: "keyword", keyword: v };
}

/**
 * A measurement input paired with a unit selector (defaults to px), so the
 * user types just the number instead of retyping the unit every time. The
 * unit selector doubles as a picker for CSS keywords (auto, fit-content...).
 */
export function UnitField({
  id,
  prop,
  label,
  value,
  keywords = [],
}: {
  id: string;
  prop: string;
  label: string;
  value: string | undefined;
  keywords?: string[];
}) {
  const commit = useStyleCommit(id);
  const parsed = parseUnitValue(value);
  const [mode, setMode] = useState(parsed.mode);
  const [number, setNumber] = useState(parsed.mode === "number" ? parsed.number : "");
  const [unit, setUnit] = useState(parsed.mode === "number" ? parsed.unit : "px");
  const [keyword, setKeyword] = useState(parsed.mode === "keyword" ? parsed.keyword : "");

  useEffect(() => {
    const p = parseUnitValue(value);
    setMode(p.mode);
    if (p.mode === "number") {
      setNumber(p.number);
      setUnit(p.unit);
    } else {
      setKeyword(p.keyword);
    }
  }, [value, id]);

  const commitNumber = (nextNumber: string, nextUnit: string) => {
    commit({ [prop]: nextNumber === "" ? "" : `${nextNumber}${nextUnit}` });
  };

  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <div className="unit-field">
        {mode === "keyword" ? (
          <input className="ui-input" value={keyword} disabled />
        ) : (
          <input
            className="ui-input"
            inputMode="decimal"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onBlur={() => commitNumber(number, unit)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        )}
        <select
          className="unit-select"
          value={mode === "keyword" ? keyword : unit}
          onChange={(e) => {
            const next = e.target.value;
            if (keywords.includes(next)) {
              setMode("keyword");
              setKeyword(next);
              commit({ [prop]: next });
            } else {
              setMode("number");
              setUnit(next);
              commitNumber(number || "0", next);
            }
          }}
        >
          {LENGTH_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
          {keywords.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export function BoxField({
  id,
  propBase,
  label,
  styles,
}: {
  id: string;
  propBase: "margin" | "padding";
  label: string;
  styles: CSSProperties;
}) {
  const sides: { key: string; label: string }[] = [
    { key: `${propBase}-top`, label: "Cima" },
    { key: `${propBase}-right`, label: "Dir" },
    { key: `${propBase}-bottom`, label: "Baixo" },
    { key: `${propBase}-left`, label: "Esq" },
  ];
  const keywords = propBase === "margin" ? ["auto"] : [];
  return (
    <div className="ui-field">
      <span className="ui-label">{label}</span>
      <div className="box-grid">
        {sides.map((s) => (
          <UnitField key={s.key} id={id} prop={s.key} label={s.label} value={styles[s.key]} keywords={keywords} />
        ))}
      </div>
    </div>
  );
}
