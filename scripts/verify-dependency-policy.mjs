import {readFile} from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const sections = ['dependencies', 'devDependencies'];
const prereleasePattern =
  /(?:^|[-.+])(alpha|beta|canary|dev|experimental|nightly|next|preview|rc)(?:[.-]|$)/i;
const floatingPattern = /^[~^*]|\bx\b|\bX\b|\blatest\b|\bnext\b|\bnightly\b/i;
const errors = [];

for (const section of sections) {
  for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
    if (typeof version !== 'string') {
      errors.push(`${section}.${name} must be a string version.`);
      continue;
    }
    if (floatingPattern.test(version)) {
      errors.push(`${section}.${name} must be exactly pinned, got ${version}.`);
    }
    if (prereleasePattern.test(version)) {
      errors.push(
        `${section}.${name} uses a prerelease channel/version: ${version}.`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(
    'Dependency policy violations:\n' +
      errors.map(error => `- ${error}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  'Dependency policy OK: all declared dependencies are exact, non-prerelease versions.',
);
