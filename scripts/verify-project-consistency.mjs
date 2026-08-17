import {readFile} from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const appJson = JSON.parse(
  await readFile(new URL('../app.json', import.meta.url), 'utf8'),
);
const androidGradle = await readFile(
  new URL('../android/app/build.gradle', import.meta.url),
  'utf8',
);
const xcodeProject = await readFile(
  new URL('../ios/DshMobile.xcodeproj/project.pbxproj', import.meta.url),
  'utf8',
);
const androidManifest = await readFile(
  new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
  'utf8',
);
const iosInfo = await readFile(
  new URL('../ios/DshMobile/Info.plist', import.meta.url),
  'utf8',
);
const nvmrc = (
  await readFile(new URL('../.nvmrc', import.meta.url), 'utf8')
).trim();
const nodeVersionFile = (
  await readFile(new URL('../.node-version', import.meta.url), 'utf8')
).trim();
const ciWorkflow = await readFile(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
);
const gradleWrapperProperties = await readFile(
  new URL(
    '../android/gradle/wrapper/gradle-wrapper.properties',
    import.meta.url,
  ),
  'utf8',
);
const gradleBootstrap = await readFile(
  new URL('./bootstrap-gradle-wrapper.mjs', import.meta.url),
  'utf8',
);

const failures = [];
const expectedVersion = packageJson.version;
const expectedNode = '24.19.0';
const expectedNpm = '11.17.0';
const expectedGradleDistributionSha256 =
  'b266d5ff6b90eada6dc3b20cb090e3731302e553a27c5d3e4df1f0d76beaff06';
const expectedGradleWrapperSha256 =
  'b3a875ddc1f044746e1b1a55f645584505f4a10438c1afea9f15e92a7c42ec13';

function captureAll(source, expression) {
  return [...source.matchAll(expression)].map(match => match[1]);
}

if (nvmrc !== expectedNode || nodeVersionFile !== expectedNode) {
  failures.push(`.nvmrc and .node-version must both pin Node ${expectedNode}.`);
}
if (packageJson.packageManager !== `npm@${expectedNpm}`) {
  failures.push(`packageManager must pin npm ${expectedNpm}.`);
}
const ciNodeVersions = captureAll(ciWorkflow, /node-version:\s*'([^']+)'/g);
if (
  ciNodeVersions.length === 0 ||
  ciNodeVersions.some(version => version !== expectedNode)
) {
  failures.push(`Every CI job must use Node ${expectedNode}.`);
}
if (
  !gradleWrapperProperties.includes(
    `distributionSha256Sum=${expectedGradleDistributionSha256}`,
  )
) {
  failures.push('Gradle distribution SHA-256 pin changed unexpectedly.');
}
if (
  !new RegExp(
    `const expectedSha256 =\\s*['"]${expectedGradleWrapperSha256}['"]`,
  ).test(gradleBootstrap)
) {
  failures.push('Gradle wrapper JAR SHA-256 pin changed unexpectedly.');
}

const androidVersions = captureAll(androidGradle, /versionName\s+"([^"]+)"/g);
if (androidVersions.length !== 1 || androidVersions[0] !== expectedVersion) {
  failures.push(
    `Android versionName must equal package.json version ${expectedVersion}.`,
  );
}

const iosVersions = [
  ...new Set(captureAll(xcodeProject, /MARKETING_VERSION = ([^;]+);/g)),
];
if (iosVersions.length !== 1 || iosVersions[0] !== expectedVersion) {
  failures.push(
    `iOS MARKETING_VERSION must equal package.json version ${expectedVersion}.`,
  );
}

if (appJson.name !== 'DshMobile' || appJson.displayName !== 'DSH Mobile') {
  failures.push(
    'app.json must keep the DshMobile module name and DSH Mobile display name.',
  );
}
if (
  !androidGradle.includes('applicationId "dev.dshmobile"') ||
  !androidGradle.includes('namespace "dev.dshmobile"')
) {
  failures.push('Android applicationId/namespace must remain dev.dshmobile.');
}
if (!xcodeProject.includes('PRODUCT_BUNDLE_IDENTIFIER = dev.dshmobile;')) {
  failures.push('iOS bundle identifier must remain dev.dshmobile.');
}
if (!androidManifest.includes('android:allowBackup="false"')) {
  failures.push('Android backups must remain disabled.');
}
if (
  !iosInfo.includes('<key>NSAllowsArbitraryLoads</key>') ||
  !iosInfo.includes('<false/>')
) {
  failures.push('iOS must not enable global NSAllowsArbitraryLoads.');
}

const allNative = `${androidGradle}\n${xcodeProject}\n${androidManifest}\n${iosInfo}`;
if (/HelloWorld|com\.helloworld/.test(allNative)) {
  failures.push(
    'React Native template placeholder identifiers remain in native project files.',
  );
}

if (failures.length > 0) {
  console.error('Project consistency verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Project consistency OK: DSH Mobile ${expectedVersion}, native identifiers and security invariants match.`,
);
