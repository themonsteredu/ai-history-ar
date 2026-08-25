import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "dist", "server");
await mkdir(outputDirectory, { recursive: true });
await copyFile(
  resolve(projectRoot, "sites-worker", "index.js"),
  resolve(outputDirectory, "index.js"),
);
