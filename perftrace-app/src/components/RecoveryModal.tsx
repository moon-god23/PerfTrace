import React, { useEffect, useState } from 'react';
import { useUIStore, useBoardStore } from '../store';
import { loadAutoSave, clearAutoSave } from '../io/autoSave';
import type { PerfTraceProject } from '../types/projectSchema';

/**
 * Shown on app startup when an auto-saved session is detected in IndexedDB.
 * The user must choose to restore or discard — the modal is non-closeable.
 */
export const RecoveryModal: React.FC = () => {
  const { isRecoveryModalOpen, setIsRecoveryModalOpen, setIsBoardSizeModalOpen } = useUIStore();
  const { loadProject } = useBoardStore();

  const [snapshot, setSnapshot] = useState<PerfTraceProject | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRecoveryModalOpen) return;
    loadAutoSave().then((saved) => {
      if (saved) setSnapshot(saved);
    });
  }, [isRecoveryModalOpen]);

  if (!isRecoveryModalOpen) return null;

  const handleRestore = async () => {
    if (!snapshot) return;
    setLoading(true);
    loadProject(snapshot);
    await clearAutoSave();
    setIsRecoveryModalOpen(false);
    setLoading(false);
  };

  const handleDiscard = async () => {
    setLoading(true);
    await clearAutoSave();
    setIsRecoveryModalOpen(false);
    // Open board-size modal so user can start fresh
    setIsBoardSizeModalOpen(true);
    setLoading(false);
  };

  const compCount = snapshot?.components?.length ?? 0;
  const traceCount = snapshot?.traces?.length ?? 0;
  const projectName = snapshot?.meta?.name ?? 'Unknown Project';
  const savedAt = snapshot?.meta?.savedAt
    ? new Date(snapshot.meta.savedAt).toLocaleString()
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-panel border border-subtle rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-main font-bold text-lg leading-tight">Unsaved Session Detected</h2>
            <p className="text-muted text-sm">PerfTrace found an auto-saved session.</p>
          </div>
        </div>

        {/* Session info */}
        {snapshot && (
          <div className="bg-surface-hover border border-subtle rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Project</span>
              <span className="text-main font-medium">{projectName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Last saved</span>
              <span className="text-muted">{savedAt}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Contents</span>
              <span className="text-muted">
                {compCount} component{compCount !== 1 ? 's' : ''},&nbsp;
                {traceCount} trace{traceCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRestore}
            disabled={loading || !snapshot}
            className="w-full py-2.5 bg-[#10b981] hover:bg-[#0d9f70] disabled:opacity-50 disabled:cursor-not-allowed text-main font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Restoring…' : 'Restore Last Session'}
          </button>
          <button
            onClick={handleDiscard}
            disabled={loading}
            className="w-full py-2.5 bg-surface-hover hover:bg-surface-active disabled:opacity-50 border border-subtle text-muted hover:text-main font-medium rounded-lg transition-colors"
          >
            Discard &amp; Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
