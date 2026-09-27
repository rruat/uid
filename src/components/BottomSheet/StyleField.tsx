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
  return (
    <div className="ui-field">
      <span className="ui-label">{label}</span>
      <div className="box-grid">
        {sides.map((s) => (
          <TextField key={s.key} id={id} prop={s.key} label={s.label} value={styles[s.key]} />
        ))}
      </div>
    </div>
  );
}
