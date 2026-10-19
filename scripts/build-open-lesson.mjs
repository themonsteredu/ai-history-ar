import { build } from 'vite';

// Bundle the same shape checks the open lesson page uses; do not maintain an unchecked copy.
await build({
  configFile: false,
  build: {
    lib: { entry: 'src/server/openLesson.ts', formats: ['es'], fileName: () => 'openLesson.js' },
    outDir: 'supabase/functions/history-ar-open', emptyOutDir: false, copyPublicDir: false, minify: false,
  },
});
