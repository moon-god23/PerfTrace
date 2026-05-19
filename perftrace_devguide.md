# PerfTrace — Step-by-Step Development Guide for AI Assistants

## How to Use This Document
This guide is intended for AI assistants helping build PerfTrace. Read the full project brief (`perftrace_brief.md`) before starting. Each phase in this guide builds on the previous one. **Do not skip phases or build features out of order** — later features depend on foundations laid in earlier phases. At the start of each phase, re-read the relevant section of the brief to align on expected behaviour.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend framework | React + TypeScript | Component-based UI, strong typing for complex data models |
| Build tool | Vite | Fast dev server, easy PWA plugin support |
| Canvas rendering | Konva.js (React-Konva) | 2D canvas abstraction with built-in zoom, pan, drag |
| Styling | Tailwind CSS | Utility-first, fast to iterate on UI |
| State management | Zustand | Lightweight, no boilerplate, easy to persist to JSON |
| File I/O | File System Access API | Native browser file open/save without a backend |
| PWA | vite-plugin-pwa | Offline support, installable, service worker generation |
| Desktop wrapper (later) | Tauri | Thin Rust shell around the web app, added in Phase 11 |
| AI API | Anthropic Claude API | Cloud auto-routing and natural language query |
| Local ML (later) | Ollama HTTP API | Same JSON context packet, different endpoint |

---

## Project Folder Structure

```
perftrace/
├── src/
│   ├── canvas/           # Grid rendering, trace drawing, layer scrubber
│   ├── components/       # React UI components (panels, toolbar, popups)
│   ├── store/            # Zustand state slices (board, nets, preferences, ui)
│   ├── rules/            # Trace Advisor rule engine
│   ├── ai/               # Context packet builder, API call handlers
│   ├── parsers/          # Netlist parsers (CSV, KiCad)
│   ├── types/            # TypeScript interfaces and enums
│   └── utils/            # Helpers (coordinate transforms, geometry, units)
├── public/
├── src-tauri/            # Added in Phase 11 only
└── package.json
```

## Essential Phases (Build and Confirm in Order)

| Phase | Feature Area | Depends On |
|---|---|---|
| Phase 1 | Bare board — grid, zoom, pan, coordinates, board size | Nothing |
| Phase 2 | Component placement — library, drag/drop, rotation, properties | Phase 1 |
| Phase 3 | Drawing tools — pen, freehand, wire jump, solder bridge, eraser, undo | Phase 2 |
| Phase 4 | Trace system — signal types, material, colour coding, wire vs solder popup | Phase 3 |
| Phase 5 | Trace Advisor — full rule engine, warnings, overlays, side panel | Phase 4 |
| Phase 6 | Save / Load — JSON save, load, auto-save, new project | Phase 5 |

After Phase 6 the app is **complete and fully usable** without any non-essential features.

## Non-Essential Phases (Add After Phase 6 in Any Order)

| Phase | Feature Area |
|---|---|
| Phase 7 | PWA and Tauri packaging |
| Phase 8 | Top/Bottom side toggle, X-ray ghost layer, layer scrubber |
| Phase 9 | Extra drawing tools — eyedropper, measure, label, test point |
| Phase 10 | Netlist import — CSV and KiCad `.net` |
| Phase 11 | Cloud AI auto-routing, natural language query, component recognition |
| Phase 12 | Local ML auto-routing via Ollama |
| Phase 13 | Full User Preferences panel, themes, configurable shortcuts, extended status bar |

---

Before writing any UI or canvas code, define these TypeScript types in `src/types/`. All features depend on them.

```typescript
// Hole coordinate on the perfboard
type HoleCoord = { col: number; row: number };

// Signal types
type SignalType = "power" | "ground" | "hf_data" | "lf_data" | "unknown";

// Trace material
type TraceMaterial = "solder" | "wire";

// A single trace segment between two holes
interface Trace {
  id: string;
  from: HoleCoord;
  to: HoleCoord;
  signalType: SignalType;
  material: TraceMaterial;
  locked: boolean;
}

// A component placed on the board
interface PlacedComponent {
  id: string;
  name: string;          // e.g. "U1"
  type: string;          // e.g. "DIP-16", "resistor", "capacitor"
  position: HoleCoord;   // top-left hole of the component
  orientation: "horizontal" | "vertical";
  pinMap: Record<number, HoleCoord>; // pin number → hole coordinate
  value?: string;        // e.g. "10kΩ", "100nF"
  locked: boolean;
}

// A net — a group of pins that must be electrically connected
interface Net {
  id: string;
  name: string;
  signalType: SignalType;
  priority: "critical" | "flexible";
  connections: { componentId: string; pin: number }[];
}

// Trace Advisor warning
type WarningSeverity = "critical" | "high" | "warning" | "suggestion";

interface AdvisorWarning {
  id: string;
  severity: WarningSeverity;
  message: string;
  affectedHoles: HoleCoord[];
  affectedComponentIds: string[];
  ruleId: string;
}

// Full board state
interface BoardState {
  rows: number;
  cols: number;
  components: PlacedComponent[];
  traces: Trace[];
  jumpers: Trace[];
  nets: Net[];
}
```

---

## Phase 1 — Project Setup and Bare Canvas

**Goal:** A working Vite + React + TypeScript project with a pannable, zoomable perfboard grid rendered on screen.

### Steps
1. Scaffold project: `npm create vite@latest perftrace -- --template react-ts`
2. Install dependencies: `react-konva`, `konva`, `zustand`, `tailwindcss`
3. Set up Tailwind CSS
4. Create a `BoardCanvas` component using `react-konva` with a `Stage` and `Layer`
5. Render the perfboard dot grid:
   - Each dot is a small `Circle` node in Konva
   - Grid spacing: 20px per hole at 100% zoom (represents 2.54mm)
   - Default board size: 30 rows × 70 cols
6. Implement zoom with mouse wheel (Konva `scaleX`/`scaleY` on Stage)
7. Implement pan with middle mouse button drag or spacebar + drag
8. Display hole coordinates (e.g. C5) in the status bar as the cursor moves

### Acceptance Criteria
- [ ] Grid renders correctly with proper spacing
- [ ] Zoom in/out works smoothly without distorting the grid
- [ ] Pan works in all directions
- [ ] Cursor hole coordinate updates in real time in the status bar

---

## Phase 2 — Component Data Model and Placement

**Goal:** Users can drag components from a library panel onto the grid, snapped to holes.

### Steps
1. Define a static component library in `src/types/componentLibrary.ts`:
   - Resistor (2 pins, horizontal/vertical)
   - Capacitor (2 pins)
   - LED (2 pins, with polarity)
   - DIP IC (8/14/16/18/20/28 pin variants)
   - Pin header (1×N, 2×N)
   - Voltage regulator (3 pin: TO-92 / TO-220 footprint)
   - Transistor BJT/MOSFET (3 pin)
2. Build the left **Component Library Panel** — categorised, searchable list
3. Implement drag from panel onto canvas
4. On drop, snap the component's top-left pin to the nearest hole
5. Compute `pinMap` automatically from component type, position, and orientation
6. Render components on the canvas:
   - Resistors/caps as simple rectangles with pin dots
   - DIP ICs as a rectangle with numbered pin dots on each side
7. Allow selecting a placed component (click to select, highlight with outline)
8. Show component properties in the right **Properties Panel** on selection
9. Allow deleting a selected component (Delete key)
10. Allow rotating a component (R key) — recalculate pinMap on rotation

### Acceptance Criteria
- [ ] All component types render correctly on the grid
- [ ] Pins snap exactly to grid holes
- [ ] PinMap is accurate for all component types and orientations
- [ ] Properties panel shows correct data on selection
- [ ] Rotation recalculates pin positions correctly

---

## Phase 3 — Manual Trace Drawing Tools

**Goal:** Users can draw traces between holes using multiple tools. This is the core manual workflow.

### Steps
1. Build the **top toolbar** with tool selector buttons
2. Implement each tool as a mode in the canvas interaction layer:

**Pen Tool (P)**
- Click a hole to start a trace
- Each subsequent click adds a segment
- Double-click or press Escape to end the trace
- Render in-progress trace as a dashed line

**Freehand Trace Tool (F)**
- Click and hold, drag across holes
- Snap to each hole as cursor passes over it
- Release to complete

**Wire Jump Tool (W)**
- Click start hole, click end hole
- Render as an arc above the board (visually distinct from solder traces)
- Arc height proportional to distance between holes

**Solder Bridge Tool (B)**
- Click any hole to bridge it to the adjacent hole (direction chosen by drag)
- Only works between immediately adjacent holes

**Trace Eraser (E)**
- Click a trace segment to delete it

**Segment Eraser**
- Erases only the clicked segment of a multi-segment trace

**Select Tool (S)**
- Click to select trace or component
- Show properties in right panel

3. Colour-code traces by signal type:
   - Power → red
   - Ground → black
   - HF data → blue
   - LF data → green
   - Unknown → grey
4. Render solder traces as flat lines, wire jumpers as arcs
5. Implement Ctrl+Z / Ctrl+Y undo/redo using a history stack in Zustand

### Acceptance Criteria
- [ ] All tools work correctly and switch cleanly between each other
- [ ] Traces snap precisely to holes
- [ ] Wire jumps render as arcs visually distinct from solder traces
- [ ] Signal type colour coding is applied correctly
- [ ] Undo/redo works for all drawing and erasing actions

---

## Phase 4 — Board Side Management and Layer Scrubber

**Goal:** Users can switch between component side and solder side, with X-ray mode and a layer scrubber.

### Steps
1. Add **side toggle button** to the toolbar (Top / Bottom)
2. When switching to Bottom/Solder side:
   - Flip the canvas horizontally using a Konva `scaleX(-1)` transform on the main layer
   - Mirror column labels accordingly (A→Z reverses visually)
   - Show persistent **"SOLDER SIDE — MIRRORED VIEW"** banner on canvas
3. Implement **X-ray mode**:
   - When on solder side, render a ghost layer of all top-side components at reduced opacity (default 30%)
   - Ghost layer opacity is controlled by a slider in User Preferences
4. Implement the **Layer Scrubber**:
   - A horizontal slider at the bottom edge of the canvas
   - Maps slider position (0–100%) to 8 layers:
     - 0% Bare grid
     - 15% Solder traces
     - 30% Solder bridges
     - 45% Jumper wires
     - 60% Solder joints
     - 75% Component bodies
     - 90% Component labels
     - 100% Annotation overlays
   - Each layer fades in smoothly using Konva opacity animation
   - Display active layer name next to slider while scrubbing
   - Snap to layer boundaries (optional, user preference)
   - Keyboard shortcuts `[` and `]` to step between layers
5. Add per-layer **eye icon toggles** in the right panel — independent of the scrubber

### Acceptance Criteria
- [ ] Horizontal flip on solder side view is accurate — holes align correctly
- [ ] X-ray ghost layer is visible and opacity-adjustable
- [ ] Layer scrubber reveals layers in correct order with smooth transitions
- [ ] Individual layer toggles work independently of the scrubber

---

## Phase 5 — Trace Advisor Rule Engine

**Goal:** Real-time rule-based suggestions and warnings appear as the user places components and draws traces.

### Steps
1. Create `src/rules/` with one file per rule category:
   - `connectionMethod.ts`
   - `routingGeometry.ts`
   - `groundTopology.ts`
   - `powerIntegrity.ts`
   - `signalSpecific.ts`
   - `thermal.ts`
   - `drcChecks.ts`
   - `reworkTips.ts`
2. Each rule file exports an array of rule functions with signature:
   ```typescript
   type RuleFn = (board: BoardState) => AdvisorWarning[];
   ```
3. Create a rule runner in `src/rules/index.ts` that:
   - Runs all rules against the current board state
   - Returns a sorted array of warnings (⛔ first, 💡 last)
   - Runs on every board state change (debounced 300ms to avoid thrashing)
4. Display warnings in the **Trace Advisor tab** of the right panel
   - Clicking a warning highlights the affected holes/components on canvas
5. Implement **canvas overlays** for warnings:
   - ⛔ Critical — red overlay directly on affected hole or component
   - 🔴 High — pulsing red halo around affected element
   - 🟡 Warning and 💡 Suggestion — shown only in side panel and status bar badge
6. Implement **hover tooltips** on flagged canvas elements showing severity and message
7. Implement the **inline wire vs solder suggestion popup**:
   - Triggers when the user finishes drawing a trace
   - Appears near the trace on canvas
   - Shows recommendation with "Keep" and "Switch" buttons
   - Auto-dismisses after 4 seconds if no action taken
8. Add **warning count badges** to the status bar (🟡 N  💡 N)

### Acceptance Criteria
- [ ] All rules from the brief fire correctly on representative test boards
- [ ] Severity levels render with correct visual treatment on canvas
- [ ] Inline popup appears after trace completion and actions work correctly
- [ ] Rule engine is debounced and does not cause performance issues

---

## Phase 6 — Save, Load, and Project File Format

**Goal:** Users can save and load projects as JSON files. The save format is the canonical context packet schema.

### Steps
1. Define the full project JSON schema in `src/types/projectSchema.ts` — this is the context packet from the brief
2. Implement **Save** using the File System Access API:
   - `showSaveFilePicker()` with `.ptrace` extension
   - Serialise full Zustand board state to JSON
3. Implement **Open/Load**:
   - `showOpenFilePicker()`
   - Parse JSON and hydrate Zustand state
   - Validate schema on load — show error if file is invalid
4. Implement **Auto-save**:
   - Save to IndexedDB (not localStorage) on every state change, debounced 2s
   - On app launch, detect unsaved session and offer to restore
5. Implement **New Project**:
   - Clear all state
   - Prompt board size selection (preset sizes or custom rows × cols)
6. Add file operations to the toolbar (New, Open, Save, Save As)

### Acceptance Criteria
- [ ] Save produces a valid JSON file that fully represents the board
- [ ] Load restores the board exactly as saved
- [ ] Auto-save recovery works after a simulated crash (close and reopen tab)
- [ ] New project clears state completely with no residual data

---

## Phase 7 — UI Panels and User Preferences

**Goal:** All UI panels are complete and a User Preferences panel exposes all configurable options.

### Steps
1. Complete the **Right Panel** with three tabs:
   - Trace Advisor tab (warnings list, click to highlight)
   - Properties tab (selected element details, editable fields)
   - Net list tab (all nets, signal types, connection status)
2. Complete the **Left Panel** (Component Library — search, categories, drag to canvas)
3. Complete the **Top Toolbar** (all tools, side toggle, zoom controls, AI route button)
4. Complete the **Bottom Status Bar** (tool name, hole coordinates, warning badges, zoom %, online/offline)
5. Build the **User Preferences Panel** (modal or slide-in drawer):
   - Layer Scrubber options
   - Board side view options
   - Trace Advisor options
   - Canvas and grid options
   - General options (theme, auto-save, keyboard shortcuts)
6. Persist preferences to IndexedDB and reload on app start
7. Implement **Light / Dark / System** theme switching via Tailwind dark mode

### Acceptance Criteria
- [ ] All panels are functional and responsive
- [ ] Preferences persist across sessions
- [ ] Theme switching works without layout shifts
- [ ] All configurable options from the brief are exposed in the preferences panel

---

## Phase 8 — Netlist Import

**Goal:** Users can import a netlist to auto-populate connections.

### Steps
1. Implement **CSV netlist parser** in `src/parsers/csvParser.ts`:
   - Format: `ComponentA, PinNumber, ComponentB, PinNumber`
   - Validate and surface errors clearly
2. Implement **KiCad `.net` parser** in `src/parsers/kicadParser.ts`:
   - Parse the KiCad netlist XML/text format
   - Extract component references, pin numbers, and net names
3. On successful import:
   - Populate the `nets` array in board state
   - Auto-place components on the grid in a default layout if they don't already exist
   - Mark all connections as unrouted (highlighted in the Net list tab)
4. Add **Import Netlist** button to the toolbar

### Acceptance Criteria
- [ ] CSV import works for hand-written netlists
- [ ] KiCad `.net` import correctly maps all nets and components
- [ ] Import errors are shown clearly with line numbers
- [ ] Imported nets appear correctly in the Net list tab

---

## Phase 9 — Cloud AI Auto-Routing

**Goal:** Users can trigger AI-powered auto-routing via the Claude API.

### Steps
1. Build the **context packet builder** in `src/ai/contextBuilder.ts`:
   - Reads current Zustand board state
   - Serialises to the JSON schema defined in the brief
   - Filters out already-routed nets
   - Appends the routing instruction string
2. Build the **API call handler** in `src/ai/cloudRouter.ts`:
   - POST to Claude API with the context packet as user message
   - Include a system prompt explaining the perfboard grid format and expected response schema
   - Parse the AI response — expect a JSON array of proposed traces
   - Apply proposed traces to board state
3. The AI response schema should be:
   ```json
   {
     "proposed_traces": [
       {
         "net": "SPI_MOSI",
         "segments": [
           { "from": "C5", "to": "C8", "material": "wire" }
         ]
       }
     ],
     "warnings": ["..."]
   }
   ```
4. Show a **loading state** on the canvas during API call (spinner overlay)
5. Show AI-proposed traces as **dashed preview** before committing — user can Accept All, Accept Selected, or Reject
6. The AI Route button should show a **"Requires Internet"** indicator and be disabled when offline
7. Handle API errors gracefully with user-facing messages

### Acceptance Criteria
- [ ] Context packet is correctly built from board state
- [ ] AI returns valid trace proposals for a representative test netlist
- [ ] Preview / accept / reject flow works correctly
- [ ] Offline state disables the button with a clear message

---

## Phase 10 — Local ML Auto-Routing (Ollama)

**Goal:** Users can run auto-routing offline using a locally installed model via Ollama.

### Steps
1. Add a **Local ML** option to the AI Route button dropdown
2. Build `src/ai/localRouter.ts`:
   - POST to `http://localhost:11434/api/chat` (Ollama default endpoint)
   - Use the **identical context packet** as the cloud router — only the URL changes
   - Parse response identically to the cloud router
3. On app launch, check if Ollama is reachable at localhost:
   - If yes — show "Local ML available" indicator in status bar
   - If no — show "Local ML unavailable — install Ollama to use offline routing"
4. Allow user to set a **custom Ollama endpoint** in User Preferences (for network-hosted models)
5. Document recommended model (e.g. `llama3`, `mistral`) in the preferences panel

### Acceptance Criteria
- [ ] Local routing produces valid trace proposals using the same JSON schema as cloud routing
- [ ] Online/offline indicator correctly reflects Ollama availability
- [ ] No code changes needed in context builder to switch between cloud and local

---

## Phase 7 (Non-Essential) — PWA and Tauri Packaging

> ⚠️ This phase is **non-essential**. The app is fully usable and testable via `npm run dev` throughout all essential phases. Packaging is only done once all essential phases are confirmed working. No packaging is needed at any earlier stage.

**Goal:** The app installs as a PWA and optionally as a native desktop app via Tauri.

### When to Do This Phase
Only after Phases 1–6 are all confirmed working and stable.

### PWA Steps
1. Install and configure `vite-plugin-pwa`
2. Define a service worker that caches all app assets for offline use
3. Add a `manifest.json` with app name, icons, and display mode
4. Test full offline functionality — all phases 1–6 must work with no network

### Tauri Steps (optional, do after PWA is stable)
1. Install Tauri CLI: `cargo install tauri-cli`
2. Run `tauri init` inside the project — this creates `src-tauri/`
3. Replace File System Access API calls with Tauri's `fs` plugin for native file dialogs
4. Replace IndexedDB auto-save with Tauri's file system for better reliability
5. Build for Windows: `tauri build`
6. Test that switching back to browser (PWA) mode still works without Tauri APIs

### Acceptance Criteria
- [ ] PWA installs on Windows, Mac, and Android without errors
- [ ] App works fully offline as a PWA (all non-AI features)
- [ ] Tauri build produces a working `.msi` installer for Windows
- [ ] Tauri and PWA share the same frontend codebase with no duplication

---

## Development Principles

- **Build phases in order.** Each phase assumes the previous one is complete and tested.
- **Define types before building features.** If a type needs changing, update it first and fix all compile errors before continuing.
- **The context packet schema is sacred.** Never change its structure without updating the brief, both routers, the parser, and the save format simultaneously.
- **Test each phase with a representative board** — at minimum a 555 timer astable circuit (3 ICs, ~8 passive components) before moving to the next phase.
- **Never use localStorage.** Use Zustand for runtime state and IndexedDB for persistence.
- **All AI calls are opt-in.** No data leaves the device unless the user explicitly triggers an AI action.
- **The rule engine must stay fast.** If the Trace Advisor causes visible lag on a 20-component board, profile and optimise before adding more rules.
