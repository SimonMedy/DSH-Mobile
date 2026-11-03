import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const gradle = readFileSync('android/app/build.gradle', 'utf8');
const release = readFileSync('.github/workflows/release.yml', 'utf8');
const signing = gradle.split('signingConfigs {')[1]?.split('buildTypes {')[0];
const releaseSigning = signing?.slice(signing.indexOf('release {'));

assert.ok(releaseSigning, 'Release signing configuration is missing');
assert.ok(releaseSigning.includes('throw new GradleException'));
assert.ok(!releaseSigning.includes('debug.keystore'));
assert.ok(gradle.includes('releaseTaskRequested'));
assert.ok(gradle.includes('hasReleaseSigning'));
assert.ok(!release.includes('assembleDebug'));
assert.ok(!release.includes('dsh-mobile-debug.apk'));
assert.ok(release.includes('apksigner'));
assert.ok(release.includes('SHA256SUMS.txt'));
assert.ok(release.includes('contents: read'));
assert.ok(release.includes('contents: write'));
assert.ok(release.includes('needs: build-apk'));
assert.ok(release.includes('refs/tags/'));

for (const filename of ['ci.yml', 'release.yml']) {
  const source = readFileSync(`.github/workflows/${filename}`, 'utf8');
  const pins = [...source.matchAll(/^\s*-?\s*uses:\s*[^@\s]+@([^\s#]+)/gm)];
  assert.ok(pins.length > 0, `No actions found in ${filename}`);
  for (const [, revision] of pins) {
    assert.match(revision, /^[a-f0-9]{40}$/);
  }
}

console.log('Release policy checks passed.');
