# Graph Report - PerfTrace  (2026-09-19)

## Corpus Check
- 44 files · ~22,640 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .ptrace 1)

## Summary
- 317 nodes · 565 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `29d61bfe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types/index.ts
- store/index.ts
- package.json
- useFileOps.ts
- BoardCanvas.tsx
- compilerOptions
- compilerOptions
- dependencies
- devDependencies
- tsconfig.json
- PerfTrace — Step-by-Step Development Guide for AI Assistants
- 5. Trace Advisor *(Local Rule Engine — works fully offline, no AI/internet needed)*
- PerfTrace — Project Brief for AI Assistants
- React + TypeScript + Vite
- rules/graphify.md
- workflows/graphify.md
- progress.md

## God Nodes (most connected - your core abstractions)
1. `useUIStore` - 29 edges
2. `react` - 18 edges
3. `PerfTrace — Step-by-Step Development Guide for AI Assistants` - 18 edges
4. `useBoardStore` - 17 edges
5. `compilerOptions` - 17 edges
6. `compilerOptions` - 16 edges
7. `AdvisorWarning` - 12 edges
8. `BoardState` - 11 edges
9. `PerfTraceProject` - 11 edges
10. `5. Trace Advisor *(Local Rule Engine — works fully offline, no AI/internet needed)*` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Steps` --references--> `BoardCanvas()`  [INFERRED]
  perftrace_devguide.md → perftrace-app/src/canvas/BoardCanvas.tsx
- `TooltipState` --references--> `AdvisorWarning`  [EXTRACTED]
  perftrace-app/src/canvas/BoardCanvas.tsx → perftrace-app/src/types/index.ts
- `BoardCanvas()` --calls--> `useBoardStore`  [EXTRACTED]
  perftrace-app/src/canvas/BoardCanvas.tsx → perftrace-app/src/store/index.ts
- `BoardCanvas()` --calls--> `useUIStore`  [EXTRACTED]
  perftrace-app/src/canvas/BoardCanvas.tsx → perftrace-app/src/store/index.ts
- `Props` --references--> `PlacedComponent`  [EXTRACTED]
  perftrace-app/src/canvas/ComponentRenderer.tsx → perftrace-app/src/types/index.ts

## Import Cycles
- None detected.

## Communities (18 total, 5 thin omitted)

### Community 0 - "types/index.ts"
Cohesion: 0.13
Nodes (27): connectionMethodRules(), drcChecks(), POLARISED_TYPES, groundTopologyRules(), runAllRules(), SEVERITY_ORDER, areConnectedByTrace(), CAP_TYPES (+19 more)

### Community 1 - "store/index.ts"
Cohesion: 0.12
Nodes (33): App(), BoardSizeModal(), LayerScrubber(), PropertiesPanel(), Tab, TABS, RecoveryModal(), SaveErrorToast() (+25 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (32): name, private, scripts, build, dev, lint, preview, type (+24 more)

### Community 3 - "useFileOps.ts"
Cohesion: 0.20
Nodes (16): Props, buildProject(), useFileOps(), deserialise(), openProjectFile(), saveProjectFile(), serialise(), BoardStore (+8 more)

### Community 4 - "BoardCanvas.tsx"
Cohesion: 0.17
Nodes (15): BoardCanvas(), getConnectedTraceIds(), isPinOf(), columnToLetter(), PopupState, TooltipState, ComponentRenderer(), TraceCompletionPopup() (+7 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 7 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, autoprefixer, clsx, konva, lucide-react, postcss, react, react-dom (+6 more)

### Community 8 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/node, @types/react (+6 more)

### Community 11 - "PerfTrace — Step-by-Step Development Guide for AI Assistants"
Cohesion: 0.05
Nodes (42): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria (+34 more)

### Community 12 - "5. Trace Advisor *(Local Rule Engine — works fully offline, no AI/internet needed)*"
Cohesion: 0.10
Nodes (21): 1. Perfboard Grid Canvas, 2. Component Placement, 3. Manual Trace Drawing, 4. AI Auto-Routing, 5. Trace Advisor *(Local Rule Engine — works fully offline, no AI/internet needed)*, 6. Board Side Management *(Top/Component Side ↔ Bottom/Solder Side)*, Connection Method Recommendations, Core Features (+13 more)

### Community 13 - "PerfTrace — Project Brief for AI Assistants"
Cohesion: 0.13
Nodes (14): Analogy to Understand the Tool, Bottom Status Bar, Canvas Tooltips (Hover), Important Constraints & Assumptions, Left Panel — Component Library, Main Canvas (Center), PerfTrace — Project Brief for AI Assistants, Right Panel (Collapsible, Tabbed) (+6 more)

### Community 14 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **163 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+158 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 176 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BoardCanvas()` connect `BoardCanvas.tsx` to `store/index.ts`, `PerfTrace — Step-by-Step Development Guide for AI Assistants`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `Steps` connect `PerfTrace — Step-by-Step Development Guide for AI Assistants` to `BoardCanvas.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _163 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `store/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12056737588652482 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06722689075630252 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._