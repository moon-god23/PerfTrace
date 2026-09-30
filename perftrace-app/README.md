# ⚡ PerfTrace Web Application

This directory contains the React 19 + TypeScript + Vite frontend application for **PerfTrace**.

For full feature documentation, screenshots, and user guides, please refer to the [Main Repository README](../README.md).

## 🚀 Development Scripts

Inside this directory, you can run:

- `npm run dev`: Starts the local Vite development server at `http://localhost:5173`.
- `npm run build`: Type-checks with TypeScript and compiles the single-file bundled HTML into `dist/index.html`.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint over all TypeScript and React files.

## 🏗️ Architecture Overview

- `src/canvas/`: Konva.js canvas rendering engine (`BoardCanvas.tsx`, `ComponentRenderer.tsx`).
- `src/components/`: Glassmorphic UI controls (`MenuBar.tsx`, `Toolbar.tsx`, `PrintModal.tsx`, `TraceAdvisorPanel.tsx`, `Sidebar.tsx`, etc.).
- `src/rules/`: Real-time Trace Advisor DRC engine (`useAdvisor.ts`, rule implementations).
- `src/store/`: Zustand state management (`useBoardStore`, `useUIStore`, `usePreferencesStore`).
- `src/io/`: Local-first IndexedDB auto-save and `.ptrace` JSON serialization.
- `src/utils/`: 1:1 true scale PDF print engine (`printEngine.ts`), theme utilities, and demo circuits.
