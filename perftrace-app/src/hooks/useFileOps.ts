import { useEffect, useCallback } from 'react';
import { useBoardStore, useUIStore } from '../store';
import { openProjectFile, saveProjectFile } from '../io/projectFile';
import { clearAutoSave } from '../io/autoSave';
import type { PerfTraceProject } from '../types/projectSchema';
import { SCHEMA_VERSION } from '../types/projectSchema';

/**
 * Builds the current board state into a PerfTraceProject ready for serialisation.
 */
function buildProject(
  state: ReturnType<typeof useBoardStore.getState>,
  existingCreatedAt?: string,
): PerfTraceProject {
  const now = new Date().toISOString();
  return {
    version: SCHEMA_VERSION,
    meta: {
      name: state.projectName,
      createdAt: existingCreatedAt ?? now,
      savedAt: now,
    },
    board: { rows: state.rows, cols: state.cols },
    components: state.components,
    traces: state.traces,
    jumpers: state.jumpers,
    nets: state.nets,
  };
}

/**
 * Provides `newProject`, `openProject`, `saveProject`, `saveAsProject` actions
 * and registers global keyboard shortcuts (Ctrl+N / O / S / Shift+S).
 *
 * Mount once in App.tsx.
 */
export function useFileOps(): {
  newProject: () => void;
  openProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  saveAsProject: () => Promise<void>;
} {
  const { setSaveErrorMessage, setIsBoardSizeModalOpen } = useUIStore();

  const showError = useCallback(
    (msg: string) => setSaveErrorMessage(msg),
    [setSaveErrorMessage],
  );

  // ── New Project ────────────────────────────────────────────────────────────
  const newProject = useCallback(() => {
    const { isDirty } = useBoardStore.getState();
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Start a new project anyway?',
      );
      if (!confirmed) return;
    }
    clearAutoSave();
    // Open the Board Size modal; the "Apply" button calls newProject on the store
    setIsBoardSizeModalOpen(true);
    // After the modal calls setBoardSize, also trigger a full reset
    useBoardStore.getState().newProject(24, 30);
  }, [setIsBoardSizeModalOpen]);

  // ── Open Project ───────────────────────────────────────────────────────────
  const openProject = useCallback(async () => {
    const { isDirty } = useBoardStore.getState();
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Open a different project anyway?',
      );
      if (!confirmed) return;
    }

    try {
      const { project, handle } = await openProjectFile();
      useBoardStore.getState().loadProject(project);
      useBoardStore.getState().setFileHandle(handle);
      await clearAutoSave();
    } catch (err: unknown) {
      if (err === 'cancelled') return;
      showError(String(err));
    }
  }, [showError]);

  // ── Save (reuse handle if available) ──────────────────────────────────────
  const saveProject = useCallback(async () => {
    const state = useBoardStore.getState();
    const project = buildProject(state);

    try {
      const handle = await saveProjectFile(project, state.fileHandle);
      state.setFileHandle(handle);
      state.setIsDirty(false);
      await clearAutoSave();
    } catch (err: unknown) {
      if (err === 'cancelled') return;
      showError(String(err));
    }
  }, [showError]);

  // ── Save As (always open picker) ──────────────────────────────────────────
  const saveAsProject = useCallback(async () => {
    const state = useBoardStore.getState();
    const project = buildProject(state);

    try {
      const handle = await saveProjectFile(project, null); // null forces picker
      state.setFileHandle(handle);
      state.setIsDirty(false);
      await clearAutoSave();
    } catch (err: unknown) {
      if (err === 'cancelled') return;
      showError(String(err));
    }
  }, [showError]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        newProject();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        openProject();
      } else if ((e.key === 's' || e.key === 'S') && e.shiftKey) {
        e.preventDefault();
        saveAsProject();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        saveProject();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [newProject, openProject, saveProject, saveAsProject]);

  return { newProject, openProject, saveProject, saveAsProject };
}
