import { mkdir, copyFile, cp } from "node:fs/promises";
import { build } from 'vite';
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "dist", "server");
await mkdir(outputDirectory, { recursive: true });
await build({ configFile: false, root: projectRoot, publicDir: false, build: {
  outDir: outputDirectory, emptyOutDir: true, target: 'es2022', minify: false,
  lib: { entry: resolve(projectRoot, 'sites-worker/index.js'), formats: ['es'], fileName: () => 'index.js' },
} });
const metadata = resolve(projectRoot, 'dist/.openai');
await mkdir(metadata, { recursive: true });
await copyFile(resolve(projectRoot, '.openai/hosting.json'), resolve(metadata, 'hosting.json'));
await cp(resolve(projectRoot, 'drizzle'), resolve(metadata, 'drizzle'), { recursive: true });
