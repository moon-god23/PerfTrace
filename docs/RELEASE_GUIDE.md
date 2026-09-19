# PerfTrace Release & Distribution Guide

This document outlines the available options for distributing PerfTrace to end-users. As a modern web application built with React and Vite, it cannot be run natively as an executable (`.exe`) out of the box without additional packaging. 

When you are ready to distribute PerfTrace to users who don't want to run `npm install`, you have three primary paths. This guide will help future developers and AI agents choose the right approach.

---

## Option 1: Native Desktop Application (Tauri)
*Targeting Phase 11 of the Roadmap*

This is the recommended path for a professional, standalone tool. It turns the web app into a lightweight, native desktop executable (e.g., `PerfTrace.exe` for Windows).

### How it Works
Traditional desktop apps (like KiCad or GIMP) are written in C/C++ and use heavy native UI frameworks. Modern tools (like VS Code or Discord) are built using web technologies (HTML/JS) and wrapped in desktop shells like Electron. 
Tauri is the modern alternative to Electron. It uses Rust to create a lightweight native window and relies on the OS's built-in web viewer (like Edge WebView2) to render the React app, resulting in extremely small file sizes and low memory usage.

### Developer Requirements (Windows)
While the user only downloads a tiny `.exe` (often <5MB), the developer compiling the app needs a significant toolchain installed:
1. **Rust Toolchain:** The compiler for Tauri's backend (~1.5GB - 2.5GB).
2. **Visual Studio C++ Build Tools:** Required by Rust to link native Windows executables (~3GB - 5GB).
3. **Build Cache:** The `target/` directory generated during compilation (~1GB - 2GB).

**Total Estimated Dev Space:** 5 GB to 9 GB.

### Pros & Cons
- **Pros:** Feels like a real native app, zero dependencies for the end-user, excellent performance, offline by default.
- **Cons:** Requires a heavy developer setup (Rust + C++ tools).

---

## Option 2: Single-File HTML Build
This is a quick, zero-installation web approach that doesn't require Rust or C++.

### How it Works
By using the `vite-plugin-singlefile` plugin, the entire React application—including all JavaScript, CSS, Konva rendering logic, and images—is bundled into one giant `index.html` file.

### Pros & Cons
- **Pros:** Zero developer setup (just an npm package), extremely easy to distribute. The user just double-clicks `PerfTrace.html` and it opens fully functional in their browser. Works offline.
- **Cons:** Can feel less "professional" than an `.exe`, and large projects can make the single HTML file quite heavy.

---

## Option 3: GitHub Pages (Live Web App)
This allows users to use PerfTrace instantly without downloading anything.

### How it Works
By setting up a GitHub Actions workflow (`.github/workflows/deploy.yml`), GitHub will automatically run `npm run build` every time code is pushed to the `main` branch. It then hosts the resulting `dist/` folder on a public URL (e.g., `https://your-username.github.io/PerfTrace`).

### Pros & Cons
- **Pros:** The lowest friction for new users. They just click a link and start drawing circuits. 
- **Cons:** Requires an internet connection to access the tool initially (though it can be cached via Service Workers / PWA tech later).

---

## Summary Decision Matrix

| Goal | Chosen Path | Required Action |
| :--- | :--- | :--- |
| **I want a professional native `.exe`** | **Option 1 (Tauri)** | Install Rust + C++ Build tools. Add Tauri to Vite. |
| **I want an offline file, but no heavy dev tools** | **Option 2 (Single HTML)** | Install `vite-plugin-singlefile` and update `vite.config.ts`. |
| **I want users to just click a link and use it** | **Option 3 (GitHub Pages)** | Add a GitHub Actions `.yml` deployment script. |
