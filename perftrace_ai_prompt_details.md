# PerfTrace — Project Brief for AI Assistants

## What I Am Building

I am building a **web-based perfboard layout and trace routing tool** called **PerfTrace**.

A perfboard (also called a prototype board or veroboard) is a generic circuit board with a pre-drilled grid of holes spaced 0.1 inches (2.54 mm) apart. Hobbyists and engineers use it for hand-soldering prototype circuits before committing to a custom PCB. Unlike a PCB, there are no pre-defined copper traces — the user creates their own connections using solder bridges, copper wire, or by cutting/joining existing strips.

> **The problem I am solving:** Tools like KiCad, EasyEDA, and Fritzing are designed for full PCB design. They are overkill and poorly suited for perfboard-specific workflows. There is currently no good dedicated tool for planning perfboard traces efficiently before soldering. I want to build one.

---

## Target Users

- Electronics hobbyists building one-off projects
- Engineers doing rapid prototyping before PCB fabrication
- Students learning electronics

---

## Typical Circuit Complexity

- Up to ~20 components per board
- Includes passive components (resistors, capacitors, LEDs) and active ICs
- ICs are mounted using **female DIP header pins** soldered to the perfboard, with the IC inserted on top
- Mix of power lines and signal lines (both high and low frequency)

---

## Core Features

### 1. Perfboard Grid Canvas
- Renders a visual dot grid representing the perfboard holes (0.1" / 2.54 mm pitch)
- Zoomable and pannable
- Toggle between component-side and copper-side view
- Standard perfboard sizes selectable (e.g. 30×70, 24×18, custom)

### 2. Component Placement
- Drag-and-drop component library onto the grid, snapped to holes
- Supported component types:
  - Resistors, capacitors, inductors, diodes, LEDs
  - DIP ICs (e.g. NE555, LM741, ATtiny85) placed via female header footprints
  - Pin headers (male/female), screw terminals
  - Voltage regulators (e.g. 7805), transistors (BJT/MOSFET)
- Each component is configurable: label, value, pinout mapping
- Components are aware of their pin count and pitch

### 3. Manual Trace Drawing
- User clicks between holes to draw copper traces
- Traces are color-coded by signal type:
  - 🔴 **Red** — Power (VCC, 5V, 12V, etc.)
  - ⚫ **Black/Blue** — Ground (GND)
  - 🔵 **Blue** — High-frequency data / signal (SPI, I2C, UART, PWM)
  - 🟢 **Green** — Low-frequency data / control signals
- Support for:
  - Solder bridges (connecting two adjacent holes)
  - Jumper wires (flying leads that jump over other traces)
  - Via markers (indicating a wire going through the board)
- Trace width and style hints based on signal type (e.g. wider traces for power)

### 4. AI Auto-Routing
- User defines a **net list**: which component pins should be electrically connected
- For each net, user specifies:
  - Signal type: Power / Ground / High-freq data / Low-freq data
  - Priority: critical path or flexible
- The AI engine then:
  - Suggests optimal trace routing on the grid
  - Minimises trace crossings
  - Respects signal integrity rules (e.g. keeping high-freq signals short, keeping power traces wide/short)
  - Avoids routing under ICs where possible
  - Flags conflicts or unroutable connections
- The AI uses knowledge of electronics best practices:
  - Decoupling capacitors close to IC power pins
  - Ground plane awareness (grouping ground connections efficiently)
  - Separation of power and signal traces

### 5. Trace Advisor *(Local Rule Engine — works fully offline, no AI/internet needed)*
- A built-in signal integrity advisor that gives **real-time suggestions** as the user places and routes traces
- Rules are hardcoded from established electronics best practices — no cloud or ML model required
- Suggestions appear as **non-blocking tooltips or a side panel** — the user is always free to override them

#### Connection Method Recommendations
  - 🔵 High-frequency signals (SPI, I2C, PWM, RF) → recommends **short direct wire jumper** over long solder trace to minimise parasitic inductance and signal degradation
  - 🔴 Power lines → recommends **wide solder trace** for lower resistance and higher current capacity
  - 🟢 Low-frequency / control signals → either method is acceptable; solder trace suggested for cleanliness
  - ⚫ Ground → recommends **solder trace** for lower impedance and a stable reference plane

#### Routing Geometry Rules
  - ⚠️ Avoid 90° trace bends on HF signal paths — suggest 45° bends to reduce signal reflection
  - ⚠️ Avoid routing traces directly under ICs — hard to inspect and rework after soldering
  - ⚠️ Minimise number of jumper wires on critical HF or power paths
  - ⚠️ HF signal trace running long or parallel to another signal — crosstalk risk

#### Ground Topology Rules
  - ⚠️ Mixed analog and digital circuit detected — recommend **star grounding** (single ground join point) to prevent digital noise coupling into analog section
  - ⚠️ Ground loop detected — suggest rerouting to a single-path ground return
  - ⚠️ Ground return path is long or indirect — suggest shorter path back to common ground point

#### Power Integrity Rules
  - ⚠️ Missing decoupling capacitor near an IC power pin
  - ⚠️ Missing bulk capacitor near the board power entry point (connector or regulator output)
  - ⚠️ Mixed-signal IC detected with separate AVCC and VCC pins — recommend separating analog and digital power traces, joined only at the power source
  - ⚠️ High-current path (motor, relay, regulator output) using a thin trace — suggest heavier wire or multiple parallel traces

#### Signal-Specific Rules
  - ⚠️ Crystal or oscillator detected — traces to XTAL pins must be very short; suggest adding ground guard traces around the oscillator circuit
  - ⚠️ I2C bus detected — recommend placing SDA/SCL pull-up resistors close to the master device
  - ⚠️ SPI bus detected — recommend grouping MISO, MOSI, and SCK traces together; CS lines are less critical
  - ⚠️ Clock signal routed near analog traces — suggest rerouting away to prevent noise injection

#### Thermal Awareness Rules
  - ⚠️ Heat-generating component (voltage regulator, power transistor, high-wattage resistor) placed adjacent to heat-sensitive component (electrolytic capacitor, crystal, precision resistor) — suggest increasing spacing or repositioning

#### DRC-Style Checks *(Design Rule Checks)*
  - ⚠️ Unconnected pin detected — floating pins on ICs can cause erratic behaviour; suggest tying to VCC or GND as appropriate
  - ⚠️ Two traces routed too close together — risk of accidental solder bridge during assembly
  - ⚠️ Net has no ground reference — circuit may not function correctly
  - ⚠️ Polarised component (electrolytic capacitor, diode, LED) placed with no polarity indicator label — suggest adding marking

#### Rework & Testability Suggestions
  - 💡 No test points defined on key nets (power rails, clock, data lines) — suggest adding accessible solder pads for probing
  - 💡 IC placed with no clearance on sides — leave at least 2 hole-widths of space for IC puller tool access

#### Warning Severity Levels
All Trace Advisor warnings are ranked into 4 severity levels:

| Level | Symbol | Meaning | UI Behaviour |
|---|---|---|---|
| Critical | ⛔ | Circuit will not work | Force user to acknowledge — blocks proceeding |
| High | 🔴 | Likely failure or damage over time | Strongly warn, allow override |
| Warning | 🟡 | Performance degraded but circuit works | Warn, easily dismissible |
| Suggestion | 💡 | Best practice / rework comfort | Subtle hint, non-intrusive |

**⛔ Critical** (circuit will not function without fix)
- Unconnected/floating pin on IC
- Net has no ground reference
- Polarised component placed in reverse
- Power and ground shorted together
- Missing pull-up resistor on I2C SDA/SCL lines

**🔴 High** (likely to cause failure or damage)
- Power trace too thin for current load
- Missing decoupling capacitor near IC power pin
- Missing bulk capacitor near power entry point
- Crystal/oscillator traces too long
- Ground return path too long or indirect
- AVCC and VCC not separated on mixed-signal IC

**🟡 Warning** (performance or reliability degraded)
- HF trace too long instead of direct wire
- Clock line routed near analog traces
- Parallel HF traces running alongside each other
- Two traces routed too close together (solder bridge risk)
- Ground loop detected
- 90° bend on HF signal trace
- Star ground not used on mixed analog/digital board

**💡 Suggestion** (best practice, circuit works fine without)
- No test points defined on key nets
- IC placed with no clearance for IC puller tool
- I2C pull-ups not placed close to master device
- SPI lines not grouped together
- Heat-generating component placed near heat-sensitive component
- Trace routed under IC body
- High jumper wire count on critical signal path
- Polarity label missing on capacitor or diode

### 6. Board Side Management *(Top/Component Side ↔ Bottom/Solder Side)*

Perfboard components are placed on the **top side** but traces are soldered on the **bottom side**. When the board is physically flipped to solder, the view mirrors horizontally — left becomes right. The app handles this with the following approach:

#### Internal Coordinate System
- All hole positions are stored relative to the **top/component side** at all times
- The flip is a **view-only transformation** — no data is changed when switching sides
- Hole C5 is always C5 internally; the renderer mirrors the canvas horizontally when the bottom view is active

#### Side Toggle
- A persistent button in the toolbar switches between **Top / Component Side** and **Bottom / Solder Side**
- When on the bottom side, a **"SOLDER SIDE — MIRRORED VIEW"** banner is always visible on the canvas

#### X-Ray Mode
- When viewing the bottom/solder side, component outlines and pin locations are shown as a **faint semi-transparent ghost layer** through the board
- Allows the user to draw traces directly to pin locations without mental mirroring
- X-ray layer opacity is user-configurable (see User Preferences below)

#### Visual Layer Distinction
- Top side components — rendered in normal colours
- Bottom side solder traces — rendered in **copper/amber tone**
- Ghost/X-ray layer of opposite side — rendered in **faint grey or blue**

#### User-Configurable Options for Board Side View

| Option | Choices | Default |
|---|---|---|
| Column label behaviour on flip | Mirror labels (A→Z reverses to Z→A) / Keep labels fixed with flip indicator | Mirror labels |
| X-ray mode | Always on when on solder side / Toggle manually / Always off | Always on |
| X-ray ghost layer opacity | Slider 10%–60% | 30% |
| Solder side trace colour | Copper/amber / Bright orange / Custom | Copper/amber |
| "SOLDER SIDE" banner | Always visible / Dismiss after 5 seconds / Never show | Always visible |
| Default active side on project open | Top side / Last used side | Top side |
- User can import a net list in:
  - Simple CSV format: `ComponentA, PinNumber, ComponentB, PinNumber`
  - KiCad `.net` export format
- The tool auto-populates components and their connections from the netlist
- User then places components on the grid and triggers auto-routing or traces manually

---

## Technical Context

| Property | Detail |
|---|---|
| Platform | Progressive Web App (PWA) — installable, works offline |
| Grid pitch | 0.1 inch / 2.54 mm standard |
| Rendering | HTML5 Canvas or SVG |
| AI integration | LLM API (e.g. Claude) — **only used when explicitly triggered by user** |
| Save/Load | JSON project files saved locally (IndexedDB / file system); optional cloud save requires internet |
| Offline-first | All core features work without internet. Internet required **only** for: AI auto-routing, cloud save/sync |

---

## UI Layout

### Main Canvas (Center)
- Perfboard grid, placed components, and drawn traces
- **⛔ Critical** warnings shown as a red overlay directly on the affected hole, component, or trace — impossible to miss
- **🔴 High** warnings shown as a pulsing red halo around the affected element on the canvas

### Right Panel (Collapsible, Tabbed)
- **Trace Advisor tab** — live list of all active warnings sorted by severity; clicking a warning highlights the relevant element on the canvas
- **Properties tab** — selected component's label, value, pin assignments, and signal type per pin
- **Net list tab** — all defined connections and their assigned signal types

### Left Panel — Component Library
- Searchable component list grouped by category (passives, ICs, connectors, power, etc.)
- Drag from panel onto canvas to place

### Top Toolbar
- File operations (new, open, save, export)
- Grid controls (zoom, toggle component/copper side view)
- Tool selector (place, draw trace, add jumper, erase, pan)
- AI Auto-Route button with visible "requires internet" indicator

### Bottom Status Bar
- Active tool name
- Cursor position in hole coordinates (e.g. D7)
- **🟡 Warning and 💡 Suggestion** counts as small dismissible badge icons — clickable to jump to Trace Advisor tab
- Zoom level
- Online / offline status indicator

### Canvas Tooltips (Hover)
- Hovering over any flagged component or trace shows an inline tooltip with the warning message and severity icon
- Keeps the canvas uncluttered while still surfacing issues on demand

> **Design principle:** The more severe the warning, the closer it appears to the problem on the canvas. Suggestions and minor warnings stay out of the way until the user looks for them.

---

When I describe this project to you, I may ask for help with any of the following:

- **UI/UX design** — how to lay out the canvas, toolbars, component panel, and properties panel
- **Grid and canvas logic** — how to render the perfboard grid, handle zoom/pan, snap components and traces to holes
- **Component model** — how to represent components, their pins, and their positions in a data structure
- **Trace routing algorithm** — pathfinding on a 2D grid (e.g. A* / Lee algorithm) adapted for perfboard constraints
- **AI prompting strategy** — how to prompt an LLM to suggest trace routes given a net list and signal types
- **Netlist parsing** — reading and interpreting KiCad or CSV net list formats
- **Signal integrity rules** — electronics best practices to encode into the routing logic
- **Tech stack decisions** — choosing the right libraries and frameworks for the job

---

## Important Constraints & Assumptions

- Perfboard holes are in a **fixed regular grid** — no irregular spacing
- ICs are always placed in **DIP package** orientation, inserted into female headers
- Traces are made of **solder or bare wire** — not etched copper like PCB
- The tool does **not** simulate circuits — it is purely a **layout and routing planning tool**
- The output is a **visual plan** the user follows while physically soldering — not a Gerber file

---

## Analogy to Understand the Tool

> Think of this as **Google Maps for perfboard wiring** — given a set of points that need to be connected, find the most efficient, conflict-free path between them, while respecting the rules of the terrain (the grid) and the nature of what's traveling through each path (power vs. data signals).

---

*Generated with Claude — PerfTrace Project, May 2026*
