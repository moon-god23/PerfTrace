import type { PerfTraceProject } from '../types/projectSchema';
import { SCHEMA_VERSION } from '../types/projectSchema';

// ─── Serialise ────────────────────────────────────────────────────────────────

export function serialise(project: PerfTraceProject): string {
  return JSON.stringify(project, null, 2);
}

// ─── Deserialise ──────────────────────────────────────────────────────────────

/**
 * Parses and validates a .ptrace JSON string.
 * Throws a user-readable error string on failure — never `Error` objects —
 * so callers can forward the message directly to a toast.
 */
export function deserialise(json: string): PerfTraceProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw 'The file is not valid JSON and cannot be opened.';
  }

  const obj = parsed as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    throw 'The file does not contain a valid PerfTrace project.';
  }
  if (obj.version !== SCHEMA_VERSION) {
    throw `Unsupported file version "${obj.version}". Expected "${SCHEMA_VERSION}".`;
  }
  if (!obj.board || !obj.components || !obj.traces) {
    throw 'The project file is missing required fields (board, components, or traces).';
  }

  return obj as unknown as PerfTraceProject;
}

// ─── Open (File System Access API) ───────────────────────────────────────────

/**
 * Shows the native file-open picker and returns the parsed project + the file
 * handle (so the user can Save without a re-picker later).
 * Throws a user-readable string on any failure.
 */
export async function openProjectFile(): Promise<{
  project: PerfTraceProject;
  handle: FileSystemFileHandle;
}> {
  if (!('showOpenFilePicker' in window)) {
    throw 'Your browser does not support the File System Access API. Please use Chrome or Edge 86+.';
  }

  let handles: FileSystemFileHandle[];
  try {
    handles = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'PerfTrace Project',
          accept: { 'application/json': ['.ptrace'] },
        },
      ],
      multiple: false,
    });
  } catch (e: any) {
    // User cancelled — not an error
    if (e?.name === 'AbortError') throw 'cancelled';
    throw 'Could not open the file. ' + (e?.message ?? '');
  }

  const handle = handles[0];
  const file = await handle.getFile();
  const text = await file.text();
  const project = deserialise(text); // throws user-readable on bad parse
  return { project, handle };
}

// ─── Save (File System Access API) ───────────────────────────────────────────

/**
 * Saves the project to disk.
 * - If `handle` is provided (from a previous Save As), overwrites silently.
 * - If no handle, shows the native Save picker and returns the new handle.
 * Returns the FileSystemFileHandle so the caller can cache it.
 * Throws a user-readable string on failure (except 'cancelled' on abort).
 */
export async function saveProjectFile(
  project: PerfTraceProject,
  handle?: FileSystemFileHandle | null,
): Promise<FileSystemFileHandle> {
  if (!('showSaveFilePicker' in window)) {
    throw 'Your browser does not support the File System Access API. Please use Chrome or Edge 86+.';
  }

  let fileHandle = handle ?? null;

  if (!fileHandle) {
    try {
      fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `${project.meta.name}.ptrace`,
        types: [
          {
            description: 'PerfTrace Project',
            accept: { 'application/json': ['.ptrace'] },
          },
        ],
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') throw 'cancelled';
      throw 'Could not open the save dialog. ' + (e?.message ?? '');
    }
  }

  try {
    const writable = await (fileHandle as any).createWritable();
    await writable.write(serialise(project));
    await writable.close();
  } catch (e: any) {
    throw 'Failed to write the file. ' + (e?.message ?? '');
  }

  return fileHandle!;
}
