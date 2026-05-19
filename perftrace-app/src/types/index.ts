export type HoleCoord = { col: number; row: number };

export type SignalType = "power" | "ground" | "hf_data" | "lf_data" | "unknown";

export type TraceMaterial = "solder" | "wire";

export interface Trace {
  id: string;
  from: HoleCoord;
  to: HoleCoord;
  signalType: SignalType;
  material: TraceMaterial;
  locked: boolean;
}

export interface PlacedComponent {
  id: string;
  name: string;          // e.g. "U1"
  type: string;          // e.g. "DIP-16", "resistor", "capacitor"
  position: HoleCoord;   // top-left hole of the component
  orientation: "horizontal" | "vertical";
  pinMap: Record<number, HoleCoord>; // pin number → hole coordinate
  value?: string;        // e.g. "10kΩ", "100nF"
  locked: boolean;
}

export interface Net {
  id: string;
  name: string;
  signalType: SignalType;
  priority: "critical" | "flexible";
  connections: { componentId: string; pin: number }[];
}

export type WarningSeverity = "critical" | "high" | "warning" | "suggestion";

export interface AdvisorWarning {
  id: string;
  severity: WarningSeverity;
  message: string;
  affectedHoles: HoleCoord[];
  affectedComponentIds: string[];
  ruleId: string;
}

export interface BoardState {
  rows: number;
  cols: number;
  components: PlacedComponent[];
  traces: Trace[];
  jumpers: Trace[];
  nets: Net[];
}
