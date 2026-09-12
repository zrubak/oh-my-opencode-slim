#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
) as {
  main?: string;
  types?: string;
  bin?: Record<string, string>;
  exports?: Record<string, { import?: string; types?: string }>;
};

const sourceEntrypoints = [
  'src/index.ts',
  'src/tui.ts',
  'src/v2/tui.ts',
  'src/cli/index.ts',
];
const requiredDistArtifacts = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/server/index.js',
  'dist/tui.js',
  'dist/tui.d.ts',
  'dist/tui2.js',
  'dist/cli/index.js',
];

function assertFile(relativePath: string, kind: string) {
  if (!existsSync(path.join(repoRoot, relativePath))) {
    throw new Error(`Missing ${kind}: ${relativePath}`);
  }
}

for (const source of sourceEntrypoints) assertFile(source, 'source entrypoint');
for (const artifact of requiredDistArtifacts) {
  assertFile(artifact, 'dist artifact');
}

const packageEntrypoints = [
  packageJson.main,
  packageJson.types,
  ...Object.values(packageJson.bin ?? {}),
  ...Object.values(packageJson.exports ?? {}).flatMap((entry) => [
    entry.import,
    entry.types,
  ]),
].filter((entry): entry is string => Boolean(entry));

for (const entrypoint of packageEntrypoints) {
  assertFile(entrypoint.replace(/^\.\//, ''), 'package entrypoint');
}

console.log(
  `Build structure verified: ${sourceEntrypoints.length} source entrypoints, ${requiredDistArtifacts.length} dist artifacts, and ${packageEntrypoints.length} package entrypoints.`,
);
