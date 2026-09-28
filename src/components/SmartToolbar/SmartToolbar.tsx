import { useState, useRef, useEffect } from "react";
import { useProject } from "../../state/ProjectContext";
import { findElement, findParent } from "../../model/document";
import { Icon } from "../Icon";
import type { ElementTag } from "../../model/types";
import "./smartToolbar.css";

interface SmartToolbarProps {
  onOpenAdd?: () => void;
  onOpenTree?: () => void;
  onOpenGuides?: () => void;
  onOpenProject?: () => void;
}

const PRESET_COLORS = [
  "transparent",
  "#ffffff",
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#94a3b8",
  "#64748b",
  "#334155",
  "#1e293b",
  "#0f172a",
  "#000000",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#4c4cf0",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
];

const SAMPLE_IMAGES = [
  { label: "Foto Natureza", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80" },
  { label: "Avatar Pessoa", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" },
  { label: "Tecnologia", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80" },
  { label: "Minimalista", url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&auto=format&fit=crop&q=80" },
  { label: "Gradiente", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80" },
];

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

function ColorPickerButton({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const color = value || "transparent";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="smart-popover-anchor" ref={popoverRef}>
      <button
        type="button"
        className="smart-color-btn"
        title={label}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="smart-color-swatch"
          style={{
            background: color === "transparent" ? "var(--surface)" : color,
            borderColor: color === "transparent" ? "var(--border)" : "transparent",
          }}
        >
          {color === "transparent" && <span className="smart-color-swatch--none" />}
        </span>
        <span className="smart-color-label">{label}</span>
      </button>

      {open && (
        <>
          <div className="smart-popover-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="smart-popover smart-color-popover">
            <div className="smart-popover-header">
              <span>{label}</span>
              <button
                type="button"
                className="smart-popover-close"
                onClick={() => setOpen(false)}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="smart-color-palette">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`smart-palette-chip ${c === value ? "is-selected" : ""}`}
                  style={{ background: c === "transparent" ? "white" : c }}
                  title={c}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                >
                  {c === "transparent" && <span className="smart-color-swatch--none" />}
                </button>
              ))}
            </div>
            <div className="smart-color-custom">
              <span className="ui-label">Personalizada</span>
              <div className="smart-input-row">
                <input
                  type="color"
                  className="smart-native-color"
                  value={value && value.startsWith("#") ? value : "#4c4cf0"}
                  onChange={(e) => onChange(e.target.value)}
                />
                <input
                  className="ui-input smart-hex-input"
                  placeholder="#000000"
                  value={value ?? ""}
                  onChange={(e) => onChange(e.target.value)}
                />
                <button
                  type="button"
                  className="ui-btn"
                  style={{ padding: "0 8px", fontSize: 12 }}
                  onClick={() => {
                    onChange("transparent");
                    setOpen(false);
                  }}
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StepperInput({
  label,
  value,
  step = 1,
  min = 0,
  unit = "px",
  onChange,
}: {
  label?: string;
  value?: string;
  step?: number;
  min?: number;
  unit?: string;
  onChange: (val: string) => void;
}) {
  const parseVal = (str?: string) => {
    if (!str) return 0;
    const match = str.match(/^(-?\d*\.?\d+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const num = parseVal(value);

  const applyDelta = (d: number) => {
    const next = Math.max(min, num + d);
    onChange(`${next}${unit}`);
  };

  return (
    <div className="smart-stepper" title={label}>
      <button
        type="button"
        className="smart-stepper-btn"
        onClick={() => applyDelta(-step)}
      >
        −
      </button>
      <input
        className="smart-stepper-val"
        value={value ?? ""}
        placeholder={`0${unit}`}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            applyDelta(step);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            applyDelta(-step);
          }
        }}
      />
      <button
        type="button"
        className="smart-stepper-btn"
        onClick={() => applyDelta(step)}
      >
        +
      </button>
    </div>
  );
}

export function SmartToolbar({ onOpenAdd, onOpenTree, onOpenGuides, onOpenProject }: SmartToolbarProps) {
  const { state, dispatch } = useProject();
  const selected = state.selectedId ? findElement(state.present.root, state.selectedId) : null;
  const isRootOrNone = !selected || selected.id === "root";
  const keyboardInset = useKeyboardInset();

  const [positionOpen, setPositionOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);
  const [textEditOpen, setTextEditOpen] = useState(false);

  const positionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const spacingRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const textEditRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (positionRef.current && !positionRef.current.contains(e.target as Node)) {
        setPositionOpen(false);
      }
      if (imageRef.current && !imageRef.current.contains(e.target as Node)) {
        setImageOpen(false);
      }
      if (spacingRef.current && !spacingRef.current.contains(e.target as Node)) {
        setSpacingOpen(false);
      }
      if (borderRef.current && !borderRef.current.contains(e.target as Node)) {
        setBorderOpen(false);
      }
      if (textEditRef.current && !textEditRef.current.contains(e.target as Node)) {
        setTextEditOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const styles = selected?.styles || {};
  const id = selected?.id || "";

  const commitStyle = (patch: Record<string, string>) => {
    if (selected) {
      dispatch({ type: "UPDATE_STYLES", id: selected.id, styles: patch });
    }
  };

  const [nudgeStep, setNudgeStep] = useState<1 | 10>(1);

  const handleNudge = (dx: number, dy: number) => {
    if (!selected) return;
    const currentLeft = parseInt(styles.left || "0", 10) || 0;
    const currentTop = parseInt(styles.top || "0", 10) || 0;
    if (styles.position !== "absolute") {
      dispatch({
        type: "SET_POSITION_MODE",
        id: selected.id,
        positionMode: "absolute",
        left: `${currentLeft + dx}px`,
        top: `${currentTop + dy}px`,
      });
    } else {
      commitStyle({
        left: `${currentLeft + dx}px`,
        top: `${currentTop + dy}px`,
      });
    }
  };

  const handleLayerOrder = (action: "front" | "back" | "forward" | "backward") => {
    if (!selected || selected.id === "root") return;
    const parent = findParent(state.present.root, selected.id);
    if (!parent) return;
    const idx = parent.children.findIndex((c) => c.id === selected.id);
    if (idx === -1) return;

    let targetIdx = idx;
    if (action === "front") targetIdx = parent.children.length - 1;
    if (action === "back") targetIdx = 0;
    if (action === "forward") targetIdx = Math.min(parent.children.length - 1, idx + 1);
    if (action === "backward") targetIdx = Math.max(0, idx - 1);

    if (targetIdx !== idx) {
      dispatch({ type: "MOVE_ELEMENT", id: selected.id, newParentId: parent.id, index: targetIdx });
    }
  };

  const handleAlignInParent = (align: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (!selected) return;
    if (styles.position === "absolute") {
      if (align === "left") commitStyle({ left: "0px", right: "auto" });
      if (align === "center") commitStyle({ left: "50%", transform: "translateX(-50%)" });
      if (align === "right") commitStyle({ right: "0px", left: "auto" });
      if (align === "top") commitStyle({ top: "0px", bottom: "auto" });
      if (align === "middle") commitStyle({ top: "50%", transform: "translateY(-50%)" });
      if (align === "bottom") commitStyle({ bottom: "0px", top: "auto" });
      return;
    }
    if (align === "left") commitStyle({ "align-self": "flex-start", "margin-left": "0", "margin-right": "auto" });
    if (align === "center") commitStyle({ "align-self": "center", "margin-left": "auto", "margin-right": "auto" });
    if (align === "right") commitStyle({ "align-self": "flex-end", "margin-left": "auto", "margin-right": "0" });
    if (align === "top") commitStyle({ "margin-top": "0", "margin-bottom": "auto" });
    if (align === "middle") commitStyle({ "margin-top": "auto", "margin-bottom": "auto" });
    if (align === "bottom") commitStyle({ "margin-top": "auto", "margin-bottom": "0" });
  };

  const isTextual = selected ? ["h1", "h2", "h3", "p", "span", "button", "a"].includes(selected.tag) : false;
  const isContainer = selected ? ["div", "section", "main", "header", "footer"].includes(selected.tag) : false;
  const isImage = selected?.tag === "img";
  const isButton = selected?.tag === "button";
  const isInput = selected?.tag === "input";

  return (
    <nav
      className="smart-toolbar"
      style={{ bottom: keyboardInset }}
      aria-label="Barra de ferramentas inteligente"
    >
      <div className="smart-toolbar__inner">
        {/* Left Side: Context indicator */}
        <div className="smart-group">
          {isRootOrNone ? (
            <div className="smart-badge-pill" title="Nenhum elemento selecionado">
              <Icon name="layout" size={15} />
              <span>Página</span>
            </div>
          ) : (
            <div className="smart-element-identity">
              <span className="smart-tag-badge">{selected.tag}</span>
              <input
                className="smart-name-input"
                value={selected.name}
                title="Renomear elemento"
                onChange={(e) => dispatch({ type: "UPDATE_NAME", id: selected.id, name: e.target.value })}
              />
              {onOpenAdd && (
                <button
                  type="button"
                  className="smart-icon-btn"
                  onClick={onOpenAdd}
                  title="Adicionar elemento"
                >
                  <Icon name="plus" size={15} />
                </button>
              )}

              {/* Position Mode Toggle (Livre / Fluxo) */}
              <button
                type="button"
                className={`smart-btn-pill ${styles.position === "absolute" ? "is-active" : ""}`}
                style={{ padding: "0 8px", height: 30 }}
                onClick={() =>
                  dispatch({
                    type: "SET_POSITION_MODE",
                    id: selected.id,
                    positionMode: styles.position === "absolute" ? "relative" : "absolute",
                  })
                }
                title={
                  styles.position === "absolute"
                    ? "Posicionamento Livre (Absoluto) ativo. Clique para voltar ao Fluxo normal."
                    : "Posicionamento em Fluxo (Relativo). Clique para ativar Posicionamento Livre."
                }
              >
                <Icon name={styles.position === "absolute" ? "move" : "layout"} size={13} />
                <span>{styles.position === "absolute" ? "Livre" : "Fluxo"}</span>
              </button>

              {/* If Absolute: Direct X and Y Steppers */}
              {styles.position === "absolute" && (
                <>
                  <div className="smart-field-inline">
                    <span className="smart-field-label">X</span>
                    <StepperInput
                      value={styles.left || "0px"}
                      step={4}
                      onChange={(v) => commitStyle({ left: v })}
                    />
                  </div>
                  <div className="smart-field-inline">
                    <span className="smart-field-label">Y</span>
                    <StepperInput
                      value={styles.top || "0px"}
                      step={4}
                      onChange={(v) => commitStyle({ top: v })}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="smart-divider" />

        {/* Root / Canvas Context */}
        {isRootOrNone && (
          <div className="smart-group">
            {onOpenAdd && (
              <button
                type="button"
                className="smart-action-btn is-accent"
                onClick={onOpenAdd}
                title="Adicionar Elemento"
              >
                <Icon name="plus" size={16} />
                <span>Adicionar</span>
              </button>
            )}

            <ColorPickerButton
              label="Fundo da página"
              value={state.present.root.styles.background || "#ffffff"}
              onChange={(color) => dispatch({ type: "UPDATE_STYLES", id: "root", styles: { background: color } })}
            />

            <div className="smart-field-inline">
              <span className="smart-field-label">Espaço</span>
              <StepperInput
                label="Padding do Canvas"
                value={state.present.root.styles.padding || "16px"}
                step={4}
                onChange={(v) => dispatch({ type: "UPDATE_STYLES", id: "root", styles: { padding: v } })}
              />
            </div>

            <div className="smart-field-inline">
              <span className="smart-field-label">Gap</span>
              <StepperInput
                label="Espaçamento entre seções"
                value={state.present.root.styles.gap || "16px"}
                step={4}
                onChange={(v) => dispatch({ type: "UPDATE_STYLES", id: "root", styles: { gap: v } })}
              />
            </div>

            {onOpenTree && (
              <button
                type="button"
                className="smart-btn-pill"
                onClick={onOpenTree}
                title="Ver Estrutura e Camadas"
              >
                <Icon name="layers" size={15} />
                <span>Camadas</span>
              </button>
            )}

            {onOpenGuides && (
              <button
                type="button"
                className="smart-btn-pill"
                onClick={onOpenGuides}
                title="Configurar Réguas, Grades & Guias"
              >
                <Icon name="ruler" size={15} />
                <span>Guias & Grade</span>
              </button>
            )}

            {onOpenProject && (
              <button
                type="button"
                className="smart-btn-pill"
                onClick={onOpenProject}
                title="Gerenciar Projeto"
              >
                <Icon name="folderOpen" size={15} />
                <span>Projeto</span>
              </button>
            )}
          </div>
        )}

        {/* Text Element Context */}
        {selected && isTextual && (
          <div className="smart-group">
            {/* Quick Text Edit Button for Mobile */}
            <div className="smart-popover-anchor" ref={textEditRef}>
              <button
                type="button"
                className={`smart-btn-pill ${textEditOpen ? "is-active" : ""}`}
                title="Editar texto"
                onClick={() => setTextEditOpen((v) => !v)}
              >
                <Icon name="textCursor" size={15} />
                <span>Editar</span>
              </button>

              {textEditOpen && (
                <>
                  <div className="smart-popover-backdrop" onClick={() => setTextEditOpen(false)} aria-hidden="true" />
                  <div className="smart-popover">
                    <div className="smart-popover-header">
                      <span>Editar texto</span>
                      <button type="button" className="smart-popover-close" onClick={() => setTextEditOpen(false)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                    <textarea
                      className="ui-input"
                      style={{ height: 80, resize: "vertical", paddingTop: 8 }}
                      value={selected.content ?? ""}
                      placeholder="Digite o texto aqui..."
                      autoFocus
                      onChange={(e) => dispatch({ type: "UPDATE_CONTENT", id, content: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Tag Selector */}
            <select
              className="smart-select"
              value={selected.tag}
              title="Tipo de texto"
              onChange={(e) => {
                const nextTag = e.target.value as ElementTag;
                dispatch({ type: "UPDATE_NAME", id, name: nextTag.toUpperCase() });
              }}
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="p">P</option>
              <option value="span">Span</option>
              {isButton && <option value="button">Botão</option>}
            </select>

            {/* Font Size Stepper */}
            <StepperInput
              label="Tamanho da fonte"
              value={styles["font-size"] || "16px"}
              step={2}
              onChange={(val) => commitStyle({ "font-size": val })}
            />

            {/* Text Color Swatch */}
            <ColorPickerButton
              label="Cor"
              value={styles.color || "#17181a"}
              onChange={(c) => commitStyle({ color: c })}
            />

            {/* Bold Toggle */}
            <button
              type="button"
              className={`smart-icon-btn ${styles["font-weight"] === "700" || styles["font-weight"] === "bold" ? "is-active" : ""}`}
              title="Negrito"
              onClick={() => {
                const isBold = styles["font-weight"] === "700" || styles["font-weight"] === "bold";
                commitStyle({ "font-weight": isBold ? "400" : "700" });
              }}
            >
              <Icon name="bold" size={16} />
            </button>

            {/* Text Alignments */}
            <div className="smart-btn-group">
              {(["left", "center", "right", "justify"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`smart-icon-btn ${styles["text-align"] === a || (!styles["text-align"] && a === "left") ? "is-active" : ""}`}
                  title={`Alinhar ${a}`}
                  onClick={() => commitStyle({ "text-align": a })}
                >
                  <Icon
                    name={
                      a === "left"
                        ? "alignLeft"
                        : a === "center"
                        ? "alignCenter"
                        : a === "right"
                        ? "alignRight"
                        : "alignJustify"
                    }
                    size={16}
                  />
                </button>
              ))}
            </div>

            {/* Spacing Popover */}
            <div className="smart-popover-anchor" ref={spacingRef}>
              <button
                type="button"
                className={`smart-icon-btn ${spacingOpen ? "is-active" : ""}`}
                title="Espaçamento do texto"
                onClick={() => setSpacingOpen((v) => !v)}
              >
                <Icon name="sliders" size={16} />
              </button>
              {spacingOpen && (
                <>
                  <div className="smart-popover-backdrop" onClick={() => setSpacingOpen(false)} aria-hidden="true" />
                  <div className="smart-popover">
                    <div className="smart-popover-header">
                      <span>Espaçamento</span>
                      <button type="button" className="smart-popover-close" onClick={() => setSpacingOpen(false)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                    <div className="smart-popover-row">
                      <span className="ui-label">Altura de linha</span>
                      <StepperInput
                        value={styles["line-height"] || "1.4"}
                        step={0.1}
                        unit=""
                        onChange={(v) => commitStyle({ "line-height": v })}
                      />
                    </div>
                    <div className="smart-popover-row">
                      <span className="ui-label">Espaço letras</span>
                      <StepperInput
                        value={styles["letter-spacing"] || "0px"}
                        step={0.5}
                        onChange={(v) => commitStyle({ "letter-spacing": v })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Container / Div Context */}
        {selected && isContainer && (
          <div className="smart-group">
            {/* Background Color */}
            <ColorPickerButton
              label="Cor de fundo"
              value={styles.background || "transparent"}
              onChange={(c) => commitStyle({ background: c })}
            />

            {/* Layout Direction */}
            <div className="smart-btn-group" title="Direção do layout">
              <button
                type="button"
                className={`smart-icon-btn ${styles.display === "flex" && styles["flex-direction"] !== "column" ? "is-active" : ""}`}
                title="Linha"
                onClick={() => commitStyle({ display: "flex", "flex-direction": "row" })}
              >
                <Icon name="columns" size={16} />
              </button>
              <button
                type="button"
                className={`smart-icon-btn ${styles.display === "flex" && styles["flex-direction"] === "column" ? "is-active" : ""}`}
                title="Coluna"
                onClick={() => commitStyle({ display: "flex", "flex-direction": "column" })}
              >
                <Icon name="rows" size={16} />
              </button>
              <button
                type="button"
                className={`smart-icon-btn ${styles.display === "grid" ? "is-active" : ""}`}
                title="Grade"
                onClick={() => commitStyle({ display: "grid" })}
              >
                <Icon name="layout" size={16} />
              </button>
            </div>

            {/* Gap Stepper */}
            <div className="smart-field-inline">
              <span className="smart-field-label">Gap</span>
              <StepperInput
                label="Espaço entre itens"
                value={styles.gap || "12px"}
                step={4}
                onChange={(v) => commitStyle({ gap: v })}
              />
            </div>

            {/* Padding Stepper */}
            <div className="smart-field-inline">
              <span className="smart-field-label">Padding</span>
              <StepperInput
                label="Padding"
                value={styles.padding || "16px"}
                step={4}
                onChange={(v) => commitStyle({ padding: v })}
              />
            </div>

            {/* Border & Radius Popover */}
            <div className="smart-popover-anchor" ref={borderRef}>
              <button
                type="button"
                className={`smart-btn-pill ${borderOpen ? "is-active" : ""}`}
                onClick={() => setBorderOpen((v) => !v)}
              >
                <Icon name="square" size={15} />
                <span>Bordas</span>
              </button>

              {borderOpen && (
                <>
                  <div className="smart-popover-backdrop" onClick={() => setBorderOpen(false)} aria-hidden="true" />
                  <div className="smart-popover">
                    <div className="smart-popover-header">
                      <span>Borda & Arredondamento</span>
                      <button type="button" className="smart-popover-close" onClick={() => setBorderOpen(false)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                    <div className="smart-popover-row">
                      <span className="ui-label">Arredondamento</span>
                      <StepperInput
                        value={styles["border-radius"] || "0px"}
                        step={4}
                        onChange={(v) => commitStyle({ "border-radius": v })}
                      />
                    </div>
                    <div className="smart-popover-row">
                      <span className="ui-label">Espessura</span>
                      <StepperInput
                        value={styles["border-width"] || "0px"}
                        step={1}
                        onChange={(v) => commitStyle({ "border-width": v, "border-style": styles["border-style"] || "solid" })}
                      />
                    </div>
                    <div className="smart-popover-row">
                      <span className="ui-label">Estilo</span>
                      <select
                        className="smart-select"
                        value={styles["border-style"] || "solid"}
                        onChange={(e) => commitStyle({ "border-style": e.target.value })}
                      >
                        <option value="none">Nenhum</option>
                        <option value="solid">Sólido</option>
                        <option value="dashed">Tracejado</option>
                        <option value="dotted">Pontilhado</option>
                      </select>
                    </div>
                    <div className="smart-popover-row">
                      <span className="ui-label">Cor da borda</span>
                      <ColorPickerButton
                        label="Borda"
                        value={styles["border-color"] || "#e2e8f0"}
                        onChange={(c) => commitStyle({ "border-color": c })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Image Context */}
        {selected && isImage && (
          <div className="smart-group">
            <div className="smart-popover-anchor" ref={imageRef}>
              <button
                type="button"
                className="smart-btn-pill is-active"
                onClick={() => setImageOpen((v) => !v)}
              >
                <Icon name="image" size={16} />
                <span>Trocar Imagem</span>
              </button>

              {imageOpen && (
                <>
                  <div className="smart-popover-backdrop" onClick={() => setImageOpen(false)} aria-hidden="true" />
                  <div className="smart-popover smart-image-popover">
                    <div className="smart-popover-header">
                      <span>Selecionar imagem</span>
                      <button type="button" className="smart-popover-close" onClick={() => setImageOpen(false)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                    <label className="ui-field">
                      <span className="ui-label">URL da imagem</span>
                      <input
                        className="ui-input"
                        placeholder="https://..."
                        value={selected.attributes?.src ?? ""}
                        onChange={(e) => dispatch({ type: "UPDATE_ATTRIBUTE", id, key: "src", value: e.target.value })}
                      />
                    </label>
                    <span className="ui-label" style={{ marginTop: 8 }}>Exemplos prontos</span>
                    <div className="smart-image-samples">
                      {SAMPLE_IMAGES.map((img) => (
                        <button
                          key={img.label}
                          type="button"
                          className="smart-image-sample-btn"
                          onClick={() => {
                            dispatch({ type: "UPDATE_ATTRIBUTE", id, key: "src", value: img.url });
                            setImageOpen(false);
                          }}
                        >
                          <img src={img.url} alt={img.label} />
                          <span>{img.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Object Fit */}
            <select
              className="smart-select"
              value={styles["object-fit"] || "cover"}
              title="Ajuste da imagem"
              onChange={(e) => commitStyle({ "object-fit": e.target.value })}
            >
              <option value="cover">Preencher</option>
              <option value="contain">Conter</option>
              <option value="fill">Esticar</option>
            </select>

            {/* Border Radius */}
            <div className="smart-field-inline">
              <span className="smart-field-label">Raio</span>
              <StepperInput
                label="Arredondamento"
                value={styles["border-radius"] || "8px"}
                step={4}
                onChange={(v) => commitStyle({ "border-radius": v })}
              />
            </div>
          </div>
        )}

        {/* Button Context */}
        {selected && isButton && (
          <div className="smart-group">
            <input
              className="smart-text-input"
              value={selected.content ?? "Botão"}
              placeholder="Rótulo"
              onChange={(e) => dispatch({ type: "UPDATE_CONTENT", id, content: e.target.value })}
            />
            <ColorPickerButton
              label="Fundo"
              value={styles.background || "#4c4cf0"}
              onChange={(c) => commitStyle({ background: c })}
            />
            <ColorPickerButton
              label="Texto"
              value={styles.color || "#ffffff"}
              onChange={(c) => commitStyle({ color: c })}
            />
            <StepperInput
              label="Raio"
              value={styles["border-radius"] || "10px"}
              step={2}
              onChange={(v) => commitStyle({ "border-radius": v })}
            />
          </div>
        )}

        {/* Input Context */}
        {selected && isInput && (
          <div className="smart-group">
            <input
              className="smart-text-input"
              value={selected.attributes?.placeholder ?? selected.content ?? ""}
              placeholder="Placeholder"
              onChange={(e) => {
                dispatch({ type: "UPDATE_ATTRIBUTE", id, key: "placeholder", value: e.target.value });
                dispatch({ type: "UPDATE_CONTENT", id, content: e.target.value });
              }}
            />
            <ColorPickerButton
              label="Borda"
              value={styles["border-color"] || "#d0d0d0"}
              onChange={(c) => commitStyle({ "border-color": c })}
            />
            <StepperInput
              label="Raio"
              value={styles["border-radius"] || "8px"}
              step={2}
              onChange={(v) => commitStyle({ "border-radius": v })}
            />
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Universal Actions (Right side of toolbar) */}
        {selected && (
          <div className="smart-group smart-group--actions">
            {/* Canva-style "Posição" Button & Popover */}
            <div className="smart-popover-anchor" ref={positionRef}>
              <button
                type="button"
                className={`smart-btn-pill ${positionOpen ? "is-active" : ""}`}
                onClick={() => setPositionOpen((v) => !v)}
                title="Posição, alinhamento e camadas"
              >
                <Icon name="pointer" size={15} />
                <span>Posição</span>
              </button>

              {positionOpen && (
                <>
                  <div className="smart-popover-backdrop" onClick={() => setPositionOpen(false)} aria-hidden="true" />
                  <div className="smart-popover smart-position-popover">
                    <div className="smart-popover-header">
                      <span>Posição & Camadas</span>
                      <button type="button" className="smart-popover-close" onClick={() => setPositionOpen(false)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>

                    <span className="ui-label">Modo de Posicionamento</span>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <button
                        type="button"
                        className={`smart-btn-pill ${styles.position !== "absolute" ? "is-active" : ""}`}
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() =>
                          dispatch({
                            type: "SET_POSITION_MODE",
                            id: selected.id,
                            positionMode: "relative",
                          })
                        }
                      >
                        Fluxo (Relative)
                      </button>
                      <button
                        type="button"
                        className={`smart-btn-pill ${styles.position === "absolute" ? "is-active" : ""}`}
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() =>
                          dispatch({
                            type: "SET_POSITION_MODE",
                            id: selected.id,
                            positionMode: "absolute",
                          })
                        }
                      >
                        Livre (Absolute)
                      </button>
                    </div>

                    {styles.position === "absolute" && (
                      <div className="smart-dim-grid" style={{ marginBottom: 8 }}>
                        <div className="ui-field">
                          <span className="smart-field-label">X (Left)</span>
                          <StepperInput
                            value={styles.left || "0px"}
                            step={4}
                            onChange={(v) => commitStyle({ left: v })}
                          />
                        </div>
                        <div className="ui-field">
                          <span className="smart-field-label">Y (Top)</span>
                          <StepperInput
                            value={styles.top || "0px"}
                            step={4}
                            onChange={(v) => commitStyle({ top: v })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="smart-divider-h" />

                    <span className="ui-label">Alinhar ao contêiner</span>
                    <div className="smart-align-grid">
                      <button type="button" className="ui-btn" onClick={() => handleAlignInParent("left")}>
                        <Icon name="alignLeft" size={16} />
                        <span>Esq</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleAlignInParent("center")}>
                        <Icon name="alignCenter" size={16} />
                        <span>Centro</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleAlignInParent("right")}>
                        <Icon name="alignRight" size={16} />
                        <span>Dir</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleAlignInParent("top")}>
                        <Icon name="alignTop" size={16} />
                        <span>Topo</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleAlignInParent("middle")}>
                        <Icon name="alignMiddle" size={16} />
                        <span>Meio</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleAlignInParent("bottom")}>
                        <Icon name="alignBottom" size={16} />
                        <span>Base</span>
                      </button>
                    </div>

                    <div className="smart-divider-h" />

                    <div className="smart-nudge-section">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="ui-label">Ajuste Fino (Nudge)</span>
                        <button
                          type="button"
                          className="smart-nudge-step-toggle"
                          onClick={() => setNudgeStep(nudgeStep === 1 ? 10 : 1)}
                          title="Alternar passo: 1px ou 10px"
                        >
                          Passo: <strong>{nudgeStep}px</strong>
                        </button>
                      </div>
                      <div className="smart-nudge-dpad">
                        <button
                          type="button"
                          className="ui-btn is-icon"
                          onClick={() => handleNudge(0, -nudgeStep)}
                          title="Mover para cima"
                        >
                          <Icon name="arrowUp" size={14} />
                        </button>
                        <div className="smart-nudge-dpad-row">
                          <button
                            type="button"
                            className="ui-btn is-icon"
                            onClick={() => handleNudge(-nudgeStep, 0)}
                            title="Mover para esquerda"
                          >
                            <Icon name="arrowLeft" size={14} />
                          </button>
                          <div className="smart-nudge-center-indicator">
                            <Icon name="move" size={12} />
                          </div>
                          <button
                            type="button"
                            className="ui-btn is-icon"
                            onClick={() => handleNudge(nudgeStep, 0)}
                            title="Mover para direita"
                          >
                            <Icon name="arrowRight" size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="ui-btn is-icon"
                          onClick={() => handleNudge(0, nudgeStep)}
                          title="Mover para baixo"
                        >
                          <Icon name="arrowDown" size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="smart-divider-h" />

                    <span className="ui-label">Ordem das Camadas</span>
                    <div className="smart-layer-grid">
                      <button type="button" className="ui-btn" onClick={() => handleLayerOrder("forward")}>
                        <Icon name="bringForward" size={16} />
                        <span>Frente</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleLayerOrder("backward")}>
                        <Icon name="sendBackward" size={16} />
                        <span>Trás</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleLayerOrder("front")}>
                        <span>Topo</span>
                      </button>
                      <button type="button" className="ui-btn" onClick={() => handleLayerOrder("back")}>
                        <span>Fundo</span>
                      </button>
                    </div>

                    <div className="smart-popover-row" style={{ marginTop: 6 }}>
                      <span className="ui-label">Z-Index</span>
                      <StepperInput
                        value={styles["z-index"] || "1"}
                        step={1}
                        unit=""
                        onChange={(v) => commitStyle({ "z-index": v })}
                      />
                    </div>

                    <div className="smart-divider-h" />

                    <span className="ui-label">Dimensões</span>
                    <div className="smart-dim-grid">
                      <div className="ui-field">
                        <span className="smart-field-label">Largura</span>
                        <StepperInput
                          value={styles.width || "auto"}
                          step={10}
                          onChange={(v) => commitStyle({ width: v })}
                        />
                      </div>
                      <div className="ui-field">
                        <span className="smart-field-label">Altura</span>
                        <StepperInput
                          value={styles.height || "auto"}
                          step={10}
                          onChange={(v) => commitStyle({ height: v })}
                        />
                      </div>
                    </div>
                    <div className="smart-dim-presets">
                      <button type="button" className="preset-pill" onClick={() => commitStyle({ width: "100%" })}>
                        100%
                      </button>
                      <button type="button" className="preset-pill" onClick={() => commitStyle({ width: "auto" })}>
                        Auto
                      </button>
                      <button type="button" className="preset-pill" onClick={() => commitStyle({ width: "fit-content" })}>
                        Fit
                      </button>
                    </div>

                    {onOpenGuides && (
                      <>
                        <div className="smart-divider-h" />
                        <button
                          type="button"
                          className="ui-btn"
                          style={{ width: "100%", justifyContent: "center", gap: 6, fontSize: 12, height: 32 }}
                          onClick={() => {
                            setPositionOpen(false);
                            onOpenGuides();
                          }}
                        >
                          <Icon name="ruler" size={14} />
                          <span>Configurar Réguas & Grade</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Duplicate */}
            <button
              type="button"
              className="smart-icon-btn"
              title="Duplicar elemento"
              onClick={() => dispatch({ type: "DUPLICATE_ELEMENT", id: selected.id })}
            >
              <Icon name="copy" size={16} />
            </button>

            {/* Delete */}
            <button
              type="button"
              className="smart-icon-btn smart-icon-btn--danger"
              title="Excluir elemento"
              onClick={() => dispatch({ type: "REMOVE_ELEMENT", id: selected.id })}
            >
              <Icon name="trash" size={16} />
            </button>

            {/* Deselect */}
            <button
              type="button"
              className="smart-icon-btn"
              title="Fechar seleção"
              onClick={() => dispatch({ type: "SELECT", id: null })}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
