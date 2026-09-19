import React, { useEffect } from 'react';
import { useUIStore } from '../store';

/**
 * Global save/load error toast.
 * Appears at the top-center of the screen and auto-dismisses after 5 seconds.
 */
export const SaveErrorToast: React.FC = () => {
  const { saveErrorMessage, setSaveErrorMessage } = useUIStore();

  useEffect(() => {
    if (!saveErrorMessage) return;
    const t = setTimeout(() => setSaveErrorMessage(''), 5000);
    return () => clearTimeout(t);
  }, [saveErrorMessage, setSaveErrorMessage]);

  if (!saveErrorMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1f0e0e] border border-[#7f1d1d] text-[#fca5a5] rounded-lg px-5 py-3 shadow-xl max-w-lg animate-fade-in">
      <svg className="w-4 h-4 shrink-0 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span className="text-sm">{saveErrorMessage}</span>
      <button
        onClick={() => setSaveErrorMessage('')}
        className="ml-auto text-muted hover:text-main transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};
