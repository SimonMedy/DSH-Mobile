import {createHash} from 'node:crypto';
import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(
  projectRoot,
  'android/gradle/wrapper/gradle-wrapper.jar',
);
const temporary = `${target}.download`;
const source =
  'https://services.gradle.org/distributions/gradle-9.3.1-wrapper.jar';
const expectedSha256 =
  'b3a875ddc1f044746e1b1a55f645584505f4a10438c1afea9f15e92a7c42ec13';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function verifyFile(path) {
  if (!existsSync(path)) return false;
  return sha256(await readFile(path)) === expectedSha256;
}

if (await verifyFile(target)) {
  console.log('Gradle wrapper JAR is already present and verified.');
  process.exit(0);
}

if (existsSync(target)) {
  throw new Error(
    'Existing Gradle wrapper JAR failed SHA-256 verification. Remove it and retry.',
  );
}

console.log('Downloading the official Gradle 9.3.1 wrapper JAR…');
const response = await fetch(source, {redirect: 'follow'});
if (!response.ok) {
  throw new Error(
    `Gradle wrapper download failed with HTTP ${response.status}.`,
  );
}

const buffer = Buffer.from(await response.arrayBuffer());
const actualSha256 = sha256(buffer);
if (actualSha256 !== expectedSha256) {
  throw new Error(
    `Gradle wrapper verification failed. Expected SHA-256 ${expectedSha256}, got ${actualSha256}.`,
  );
}

await mkdir(dirname(target), {recursive: true});
try {
  await writeFile(temporary, buffer, {flag: 'wx'});
  await rename(temporary, target);
} catch (error) {
  if (existsSync(temporary)) await unlink(temporary);
  throw error;
}

console.log('Installed and verified the official Gradle 9.3.1 wrapper JAR.');
