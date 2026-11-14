import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  // If running in GitHub Actions for GitHub Pages, base path is /StudyFlow/ (or repo name)
  const repoName = process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : './';

  return {
    base: command === 'serve' ? '/' : repoName,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(typeof import.meta !== 'undefined' && import.meta.dirname ? import.meta.dirname : '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      sourcemap: false,
      minify: 'esbuild' as const,
      cssMinify: true,
      reportCompressedSize: false,
    },
    esbuild: {
      legalComments: 'none' as const,
      drop: process.env.NODE_ENV === 'production' ? (['debugger'] as ('console' | 'debugger')[]) : [],
    },
  };
});
