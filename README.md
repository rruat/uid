# UID — Editor Visual Mobile First

Editor visual de interfaces web ("Canva/Figma para HTML/CSS"), mobile first, feito como PWA.
Constrói uma árvore real de elementos HTML/CSS a partir de um canvas infinito e um bottom sheet
de propriedades, e permite salvar/abrir o projeto como um arquivo `.uix` (JSON estruturado) ou
exportar para `index.html` / `style.css` / `script.js`.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview
```

## Deploy no GitHub Pages

Duas opções, ambas publicam em `https://<usuário>.github.io/uid/`:

1. **Automático (recomendado):** faça push para a branch `main`. O workflow em
   `.github/workflows/deploy.yml` builda e publica via GitHub Actions. Na primeira vez, habilite
   em *Settings → Pages → Source → GitHub Actions* no repositório.
2. **Manual:** `npm run deploy` (usa o pacote `gh-pages` para publicar a pasta `dist` na branch
   `gh-pages`).

O `base` do Vite já está configurado para `/uid/` em [vite.config.ts](vite.config.ts) — se o
repositório for renomeado, atualize esse valor (e `start_url`/`scope` do manifest) de acordo.

## Arquitetura

```
src/
  model/       Document Model (.uix), CSS engine, geração de HTML/CSS, storage (.uix + IndexedDB)
  state/       Reducer + Context (documento, seleção, undo/redo, modo visual/code/preview)
  components/
    Canvas/    Canvas infinito (pan/zoom/pinch) + renderer recursivo da árvore
    BottomSheet/ Painéis contextuais (Adicionar, Projeto, Propriedades por elemento)
    Tree/      Árvore de elementos (selecionar, mover, indentar, excluir)
    CodeView/  Visualização do HTML/CSS/JS gerado
    Preview/   Preview isolado em iframe sandboxed
```

O `.uix` é o documento-fonte do projeto (árvore de elementos + estilos + metadados); HTML/CSS/JS
são sempre *gerados* a partir dele, nunca o formato de armazenamento principal.

## Escopo atual (MVP)

Canvas infinito, elementos básicos (container, div, texto, título, parágrafo, botão, imagem,
input), propriedades essenciais (tamanho, espaçamento, layout/flex, tipografia, cor, fundo,
borda, sombra, posição), árvore de elementos, undo/redo, autosave em IndexedDB, salvar/abrir
`.uix`, exportar HTML/CSS/JS/ZIP e preview isolado.

Fora do escopo por enquanto (fases seguintes): CSS Grid avançado, animações/transições,
componentes reutilizáveis, variáveis de projeto na UI, breakpoints responsivos, editor de
código bidirecional e IA.
