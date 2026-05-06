import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite 8 / rolldown on Linux with npm workspaces cannot resolve relative
 * chunk imports (e.g. `from "./chunk-XXXXXXXX.mjs"`) when the importer
 * is accessed via a `../node_modules/` path (node_modules lives in the
 * parent directory of the workspace root).
 *
 * Two complementary hooks cover both cases:
 *  - resolveId: returns an absolute path when rolldown asks us to resolve
 *    a relative chunk import from inside node_modules.
 *  - load: rewrites relative chunk imports to absolute paths inside the
 *    source of any react-router development-build file, so rolldown never
 *    has to resolve them relative to a `../…` importer.
 */
function fixRolldownNodeModulesChunks() {
  return {
    name: 'fix-rolldown-node-modules-chunks',
    enforce: 'pre',
    apply: 'build',
    resolveId(id, importer) {
      if (id.startsWith('./chunk-') && importer && importer.includes('node_modules')) {
        const absImporter = path.isAbsolute(importer) ? importer : path.resolve(importer)
        return path.resolve(path.dirname(absImporter), id)
      }
    },
    load(id) {
      if (!id.includes('react-router') || !id.includes('dist/development')) return null
      try {
        const abs = path.isAbsolute(id) ? id : path.resolve(id)
        const src = fs.readFileSync(abs, 'utf-8')
        const dir = path.dirname(abs)
        const out = src.replace(
          /"(\.\/chunk-[^"]+\.mjs)"/g,
          (_, chunk) => JSON.stringify(pathToFileURL(path.resolve(dir, chunk)).href),
        )
        return { code: out }
      } catch {
        return null
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), fixRolldownNodeModulesChunks()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['src/test/**', 'src/main.jsx'],
      thresholds: {
        lines:     65,
        functions: 55,
        branches:  45,
      },
    },
  },
})
