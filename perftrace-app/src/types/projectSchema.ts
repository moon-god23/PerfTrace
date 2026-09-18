import type { PlacedComponent, Trace, Net } from './index';

/**
 * Version token embedded in every .ptrace file.
 * Bump when the schema changes in a breaking way.
 */
export const SCHEMA_VERSION = '1.0' as const;
export type SchemaVersion = typeof SCHEMA_VERSION;

export interface ProjectMeta {
  /** Human-readable project name (defaults to "Untitled Project") */
  name: string;
  /** ISO-8601 timestamp of initial creation */
  createdAt: string;
  /** ISO-8601 timestamp of last save */
  savedAt: string;
}

export interface ProjectBoard {
  rows: number;
  cols: number;
}

/**
 * The complete serialised project — written to disk as JSON with the .ptrace extension.
 * This is also the "context packet" schema used by the AI auto-router (Phase 9).
 * Do NOT change field names or remove fields without updating the AI router and parsers.
 */
export interface PerfTraceProject {
  /** Identifies the file format version for future migration support */
  version: SchemaVersion;
  meta: ProjectMeta;
  board: ProjectBoard;
  components: PlacedComponent[];
  traces: Trace[];
  /** Wire-jump traces kept separate so the AI router can distinguish them */
  jumpers: Trace[];
  nets: Net[];
}
