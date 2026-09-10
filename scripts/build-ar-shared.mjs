import { build } from 'vite';

// Bundle the same validation code used in the app; do not maintain an unchecked copy.
await build({
  configFile: false,
  build: {
    lib: { entry: 'src/server/arShared.ts', formats: ['es'], fileName: () => 'arShared.js' },
    outDir: 'supabase/functions/history-ar', emptyOutDir: false, minify: false,
  },
});
