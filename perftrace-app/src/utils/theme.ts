import type { AppTheme } from '../store/preferencesStore';

let _systemListener: ((e: MediaQueryListEvent) => void) | null = null;
let _mq: MediaQueryList | null = null;

/**
 * Applies the given theme to the <html> element via a `data-theme` attribute.
 * 'system' follows the OS preference and sets up a listener for future changes.
 */
export function applyTheme(theme: AppTheme): void {
  // Clean up any existing system listener
  if (_mq && _systemListener) {
    _mq.removeEventListener('change', _systemListener);
    _systemListener = null;
    _mq = null;
  }

  if (theme === 'system') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    _mq = mq;
    const apply = (isDark: boolean) => {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };
    apply(mq.matches);
    _systemListener = (e) => apply(e.matches);
    mq.addEventListener('change', _systemListener);
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
