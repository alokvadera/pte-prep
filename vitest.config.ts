import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The shell this project is usually run from exports NODE_ENV=production, which
// makes React load its production build — and the production build has no
// `act`, so Testing Library cannot render anything. Tests need the
// development build.
process.env.NODE_ENV = 'test'

// A config of its own, separate from `vite.config.ts`: the app build pulls in
// the PWA plugin and Tailwind, neither of which a test run needs, and loading
// them would slow every worker down for no benefit. The `@` alias and the React
// transform are the only two things the tests actually depend on.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // `react-router-dom` re-exports from `react-router`, but the two can end
    // up as separate module instances — and therefore separate router
    // contexts — unless they are forced onto one copy.
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  test: {
    environment: 'jsdom',
    // Reuse one jsdom per worker instead of building a fresh one per file. The
    // suite is a hundred-odd files, and constructing an environment for each
    // of them dominates the run time. Per-file isolation is preserved.
    pool: 'vmThreads',
    // Explicit imports from 'vitest' in every test file, rather than ambient
    // globals. It keeps the test files honest about what they depend on and
    // lets the type checker see the imports.
    globals: false,
    setupFiles: ['./tests/setup/browser-env.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        // `react-router-dom` reaches the router through `react-router/dom`
        // while the app reaches it through `react-router`. If the two are
        // loaded by different resolvers they end up as separate instances,
        // and a router from one cannot be read by the other — which shows up
        // as "useRoutes() may be used only in the context of a <Router>".
        inline: ['react-router', 'react-router/dom', 'react-router-dom'],
      },
    },
    restoreMocks: true,
    unstubGlobals: true,
    // The suite is a hundred-odd files of jsdom render tests. The failures
    // that used to appear here were timeouts, not slow assertions, and the
    // cause was the audit scripts leaking a headless Chrome per run: the
    // accumulated browsers loaded the machine until the workers were starved
    // (see scripts/lib/chrome.mjs). With that fixed the suite runs in about
    // ten seconds. The headroom below is for a loaded CI machine, where the
    // same starvation can happen for other reasons.
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}', 'functions/**/*.ts'],
      // `functions/types.ts` is a type-only module: it compiles to nothing, so
      // there is no runtime code in it to cover. `src/components/ui/index.ts`
      // is a barrel of re-exports, which is the same thing — it has no
      // executable statement of its own, only imports. The barrel is still
      // exercised by a test that imports it and checks its names.
      exclude: ['src/**/*.d.ts', 'functions/types.ts', 'src/components/ui/index.ts'],
      thresholds: { lines: 99, branches: 99, functions: 99, statements: 99 },
    },
  },
})
