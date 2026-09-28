import { Icon } from "../Icon";
import { findParent } from "../../model/document";
import type { UixElement } from "../../model/types";
import { useProject } from "../../state/ProjectContext";
import { GridEditor } from "./GridEditor";
import { BoxField, ColorField, SelectField, TextField, UnitField } from "./StyleField";

/** Sets width and height to whichever of the two is currently a real
 * (non-keyword) size, so one tap makes the element square. */
function makeSquareValue(styles: UixElement["styles"]): string {
  const isReal = (v: string | undefined) => v && !/^(auto|fit-content|min-content|max-content)$/.test(v);
  return (isReal(styles.width) && styles.width) || (isReal(styles.height) && styles.height) || "100px";
}

const BORDER_STYLE_KEYWORDS = new Set([
  "none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset",
]);

/** Presets like Button ship a `border` shorthand — read it into the three
 * split fields so they don't show blank until the user touches them. Only
 * used as a display fallback; editing a field writes the longhand property,
 * which naturally overrides the shorthand (declared earlier in the object). */
function splitBorderShorthand(border: string | undefined): { width?: string; style?: string; color?: string } {
  if (!border) return {};
  const rest: string[] = [];
  let width: string | undefined;
  let style: string | undefined;
  for (const token of border.trim().split(/\s+/)) {
    if (!style && BORDER_STYLE_KEYWORDS.has(token)) style = token;
    else if (!width && /^[\d.]+[a-z%]*$/.test(token)) width = token;
    else rest.push(token);
  }
  return { width, style, color: rest.join(" ") || undefined };
}

const TEXT_TAGS = new Set(["h1", "h2", "h3", "p", "span", "button", "a", "li"]);

export type TabKey =
  | "tamanho"
  | "espacamento"
  | "layout"
  | "tipografia"
  | "cores"
  | "borda"
  | "fundo"
  | "sombra"
  | "posicao";

/** The tab chips are rendered fixed at the bottom of the sheet (by BottomSheet),
 * so it needs this same list to know what to show — kept in one place here. */
export function getPropertiesTabs(element: UixElement): { key: TabKey; label: string }[] {
  const isTextual = TEXT_TAGS.has(element.tag);
  return [
    { key: "tamanho", label: "Tamanho" },
    { key: "espacamento", label: "Espaçamento" },
    { key: "layout", label: "Layout" },
    ...(isTextual ? [{ key: "tipografia" as TabKey, label: "Tipografia" }] : []),
    { key: "cores", label: "Cores" },
    { key: "fundo", label: "Fundo" },
    { key: "borda", label: "Borda" },
    { key: "sombra", label: "Sombra" },
    { key: "posicao", label: "Posição" },
  ];
}

export function PropertiesPanel({
  element,
  tab,
  onOpenAdd,
}: {
  element: UixElement;
  tab: TabKey;
  onOpenAdd: () => void;
}) {
  const { state, dispatch } = useProject();
  const parent = findParent(state.present.root, element.id);
  const parentIsGrid = parent?.styles.display === "grid";
  const styles = element.styles;
  const id = element.id;

  return (
    <div className="props-panel">
      <div className="props-panel__header">
        <div className="ui-row" style={{ gap: 6 }}>
          <span className="tag-badge">{element.tag}</span>
          <input
            className="element-name-input"
            value={element.name}
            onChange={(e) => dispatch({ type: "UPDATE_NAME", id, name: e.target.value })}
          />
        </div>
        <div className="ui-row">
          <button className="ui-btn is-icon" title="Adicionar dentro" onClick={onOpenAdd}>
            <Icon name="plus" size={16} />
          </button>
          <button className="ui-btn is-icon" title="Duplicar" onClick={() => dispatch({ type: "DUPLICATE_ELEMENT", id })}>
            <Icon name="copy" size={16} />
          </button>
          <button
            className="ui-btn is-icon"
            title="Excluir"
            onClick={() => dispatch({ type: "REMOVE_ELEMENT", id })}
          >
            <Icon name="trash" size={16} />
          </button>
          <button className="ui-btn is-icon" title="Fechar" onClick={() => dispatch({ type: "SELECT", id: null })}>
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div className="props-panel__body">
        {tab === "tamanho" && (
          <div className="field-grid">
            <div className="ui-field">
              <UnitField
                id={id}
                prop="width"
                label="Width"
                value={styles.width}
                keywords={["auto", "fit-content", "min-content", "max-content"]}
              />
            </div>
            <div className="ui-field">
              <UnitField
                id={id}
                prop="height"
                label="Height"
                value={styles.height}
                keywords={["auto", "fit-content", "min-content", "max-content"]}
              />
            </div>
            <button
              className="ui-btn"
              style={{ gridColumn: "1 / -1" }}
              onClick={() => {
                const square = makeSquareValue(styles);
                dispatch({ type: "UPDATE_STYLES", id, styles: { width: square, height: square } });
              }}
            >
              <Icon name="square" size={16} />
              Tornar quadrado (width = height)
            </button>
            <UnitField id={id} prop="min-width" label="Min width" value={styles["min-width"]} keywords={["auto"]} />
            <UnitField id={id} prop="max-width" label="Max width" value={styles["max-width"]} keywords={["none"]} />
            <UnitField id={id} prop="min-height" label="Min height" value={styles["min-height"]} keywords={["auto"]} />
            <UnitField id={id} prop="max-height" label="Max height" value={styles["max-height"]} keywords={["none"]} />
          </div>
        )}

        {tab === "espacamento" && (
          <div className="field-grid">
            <BoxField id={id} propBase="padding" label="Padding" styles={styles} />
            <BoxField id={id} propBase="margin" label="Margin" styles={styles} />
          </div>
        )}

        {tab === "layout" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {parentIsGrid && (
              <div className="field-grid">
                <TextField
                  id={id}
                  prop="grid-area"
                  label="Área da grade (grid-area)"
                  value={styles["grid-area"]}
                  placeholder="item-1"
                />
              </div>
            )}

            <div className="field-grid">
              <SelectField
                id={id}
                prop="display"
                label="Display"
                value={styles.display}
                options={[
                  { value: "block", label: "Block" },
                  { value: "inline-block", label: "Inline block" },
                  { value: "flex", label: "Flex" },
                  { value: "grid", label: "Grid" },
                  { value: "none", label: "None" },
                ]}
              />
            </div>

            {styles.display === "flex" && (
              <div className="field-grid">
                <SelectField
                  id={id}
                  prop="flex-direction"
                  label="Direção"
                  value={styles["flex-direction"]}
                  options={[
                    { value: "row", label: "Linha" },
                    { value: "column", label: "Coluna" },
                    { value: "row-reverse", label: "Linha reversa" },
                    { value: "column-reverse", label: "Coluna reversa" },
                  ]}
                />
                <SelectField
                  id={id}
                  prop="flex-wrap"
                  label="Quebra"
                  value={styles["flex-wrap"]}
                  options={[
                    { value: "nowrap", label: "Sem quebra" },
                    { value: "wrap", label: "Quebrar" },
                  ]}
                />
                <SelectField
                  id={id}
                  prop="justify-content"
                  label="Justify"
                  value={styles["justify-content"]}
                  options={[
                    { value: "flex-start", label: "Início" },
                    { value: "center", label: "Centro" },
                    { value: "flex-end", label: "Fim" },
                    { value: "space-between", label: "Entre" },
                    { value: "space-around", label: "Ao redor" },
                  ]}
                />
                <SelectField
                  id={id}
                  prop="align-items"
                  label="Align"
                  value={styles["align-items"]}
                  options={[
                    { value: "stretch", label: "Esticar" },
                    { value: "flex-start", label: "Início" },
                    { value: "center", label: "Centro" },
                    { value: "flex-end", label: "Fim" },
                  ]}
                />
                <UnitField id={id} prop="gap" label="Gap" value={styles.gap} />
              </div>
            )}

            {styles.display === "grid" && <GridEditor id={id} styles={styles} />}
          </div>
        )}

        {tab === "tipografia" && (
          <div className="field-grid">
            <UnitField id={id} prop="font-size" label="Font size" value={styles["font-size"]} />
            <SelectField
              id={id}
              prop="font-weight"
              label="Peso"
              value={styles["font-weight"]}
              options={[
                { value: "400", label: "Normal" },
                { value: "500", label: "Medium" },
                { value: "600", label: "Semibold" },
                { value: "700", label: "Bold" },
              ]}
            />
            <TextField id={id} prop="line-height" label="Line height" value={styles["line-height"]} placeholder="1.4" />
            <UnitField id={id} prop="letter-spacing" label="Letter spacing" value={styles["letter-spacing"]} keywords={["normal"]} />
            <SelectField
              id={id}
              prop="text-align"
              label="Alinhamento"
              value={styles["text-align"]}
              options={[
                { value: "left", label: "Esquerda" },
                { value: "center", label: "Centro" },
                { value: "right", label: "Direita" },
                { value: "justify", label: "Justificado" },
              ]}
            />
            <ContentEditor id={id} value={element.content} />
          </div>
        )}

        {tab === "cores" && (
          <div className="field-grid">
            <ColorField id={id} prop="color" label="Cor do texto" value={styles.color} />
          </div>
        )}

        {tab === "fundo" && (
          <div className="field-grid">
            <ColorField id={id} prop="background" label="Background" value={styles.background} />
          </div>
        )}

        {tab === "borda" && (() => {
          const legacy = splitBorderShorthand(styles.border);
          return (
            <div className="field-grid">
              <UnitField
                id={id}
                prop="border-width"
                label="Espessura"
                value={styles["border-width"] ?? legacy.width}
              />
              <SelectField
                id={id}
                prop="border-style"
                label="Estilo"
                value={styles["border-style"] ?? legacy.style}
                options={[
                  { value: "none", label: "Nenhuma" },
                  { value: "solid", label: "Sólida" },
                  { value: "dashed", label: "Tracejada" },
                  { value: "dotted", label: "Pontilhada" },
                  { value: "double", label: "Dupla" },
                ]}
              />
              <ColorField
                id={id}
                prop="border-color"
                label="Cor da borda"
                value={styles["border-color"] ?? legacy.color}
              />
              <UnitField id={id} prop="border-radius" label="Border radius" value={styles["border-radius"]} />
            </div>
          );
        })()}

        {tab === "sombra" && (
          <div className="field-grid">
            <TextField
              id={id}
              prop="box-shadow"
              label="Box shadow"
              value={styles["box-shadow"]}
              placeholder="0px 4px 20px rgba(0,0,0,.1)"
            />
          </div>
        )}

        {tab === "posicao" && (
          <div className="field-grid">
            <SelectField
              id={id}
              prop="position"
              label="Position"
              value={styles.position}
              options={[
                { value: "static", label: "Static" },
                { value: "relative", label: "Relative" },
                { value: "absolute", label: "Absolute" },
                { value: "fixed", label: "Fixed" },
                { value: "sticky", label: "Sticky" },
              ]}
            />
            <UnitField id={id} prop="top" label="Top" value={styles.top} keywords={["auto"]} />
            <UnitField id={id} prop="right" label="Right" value={styles.right} keywords={["auto"]} />
            <UnitField id={id} prop="bottom" label="Bottom" value={styles.bottom} keywords={["auto"]} />
            <UnitField id={id} prop="left" label="Left" value={styles.left} keywords={["auto"]} />
            <TextField id={id} prop="z-index" label="Z-index" value={styles["z-index"]} />
          </div>
        )}
      </div>
    </div>
  );
}

function ContentEditor({ id, value }: { id: string; value: string | undefined }) {
  const { dispatch } = useProject();
  return (
    <label className="ui-field" style={{ gridColumn: "1 / -1" }}>
      <span className="ui-label">Texto</span>
      <textarea
        className="ui-input"
        style={{ height: 64, resize: "vertical", paddingTop: 8 }}
        defaultValue={value}
        onBlur={(e) => dispatch({ type: "UPDATE_CONTENT", id, content: e.target.value })}
      />
    </label>
  );
}
