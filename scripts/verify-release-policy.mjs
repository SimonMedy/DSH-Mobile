import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const gradle = readFileSync('android/app/build.gradle', 'utf8');
const release = readFileSync('.github/workflows/release.yml', 'utf8');
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');

function check(condition, description) {
  assert.ok(condition, `Release security policy: ${description}`);
}

const signing = gradle.split('signingConfigs {')[1]?.split('buildTypes {')[0];
const releaseSigning = signing?.slice(signing.indexOf('release {'));
check(releaseSigning?.includes('release {'), 'release signing config missing');
check(
  releaseSigning.includes('throw new GradleException'),
  'release signing must fail when credentials are absent',
);
check(
  !releaseSigning.includes('debug.keystore'),
  'release signing must never use the public debug keystore',
);
check(
  gradle.includes('releaseTaskRequested') && gradle.includes('hasReleaseSigning'),
  'release build must require a complete signing identity',
);

check(!release.includes('assembleDebug'), 'release pipeline must not build debug APKs');
check(
  !release.includes('dsh-mobile-debug.apk'),
  'release pipeline must not publish debug APKs',
);
check(release.includes('apksigner'), 'release signer verification missing');
check(release.includes('SHA256SUMS.txt'), 'release checksum output missing');
check(
  release.includes('contents: read') && release.includes('contents: write'),
  'separate read-only build and limited write publish permissions required',
);
check(
  release.includes('needs: build-apk') && release.includes('refs/tags/'),
  'publish must depend on verified build and a release tag',
);

for (const [name, workflow] of [
  ['CI', ci],
  ['release', release],
]) {
  const actions = [...workflow.matchAll(/^\s*-?\s*uses:\s*[^@\s]+@([^\s#]+)/gm)];
  check(actions.length > 0, `${name} has no pinned actions to verify`);
  for (const [, revision] of actions) {
    check(
      /^[a-f0-9]{40}$/.test(revision),
      `${name} references an action without a full immutable commit SHA`,
    );
  }
}

console.log('Release policy checks passed.');
