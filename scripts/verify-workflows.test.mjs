import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parse } from "yaml";
import {
  assertRegistryVersionAbsent,
  parseArguments,
  validatePackedFiles,
  validateReleaseMetadata,
  validateRepositoryContext,
  writeArtifactChecksum,
} from "./verify-release.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const stablePackage = {
  name: "@nipe-solutions/caret-geometry",
  version: "1.0.0",
  repository: {
    type: "git",
    url: "git+https://github.com/NIPE-Solutions/caret-geometry.git",
  },
  publishConfig: { access: "public", provenance: true, tag: "latest" },
};
const stableChangelog = "## 1.0.0 — 2026-09-30\n";
const releaseTarball = "nipe-solutions-caret-geometry-1.0.0.tgz";
const githubRef = "$" + "{{ github.ref }}";

test("stable release metadata returns the latest channel", () => {
  assert.deepEqual(validateReleaseMetadata(stablePackage, stableChangelog), {
    name: stablePackage.name,
    version: "1.0.0",
    channel: "latest",
  });
});

test("repository metadata satisfies stable release policy", async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
  );
  const changelog = await readFile(
    path.join(repositoryRoot, "CHANGELOG.md"),
    "utf8",
  );
  assert.deepEqual(validateReleaseMetadata(packageJson, changelog), {
    name: "@nipe-solutions/caret-geometry",
    version: "1.0.0",
    channel: "latest",
  });
});

test("stable metadata rejects prereleases and incomplete records", () => {
  for (const version of ["1.0.0-alpha.1", "1.0.0+build.1", "01.0.0", "1.0"]) {
    assert.throws(
      () =>
        validateReleaseMetadata(
          { ...stablePackage, version },
          "## " + version + " — 2026-09-30\n",
        ),
      /stable semantic version/,
    );
  }

  const invalidCases = [
    [{ ...stablePackage, name: "@example/wrong" }, stableChangelog],
    [
      {
        ...stablePackage,
        repository: { type: "git", url: "https://example.com/wrong" },
      },
      stableChangelog,
    ],
    [
      {
        ...stablePackage,
        publishConfig: { ...stablePackage.publishConfig, access: "restricted" },
      },
      stableChangelog,
    ],
    [
      {
        ...stablePackage,
        publishConfig: { ...stablePackage.publishConfig, provenance: false },
      },
      stableChangelog,
    ],
    [
      {
        ...stablePackage,
        publishConfig: { ...stablePackage.publishConfig, tag: "alpha" },
      },
      stableChangelog,
    ],
    [stablePackage, "## Unreleased\n"],
  ];
  for (const [manifest, changelog] of invalidCases) {
    assert.throws(() => validateReleaseMetadata(manifest, changelog));
  }
});

test("repository context requires the exact release tag and clean state", () => {
  const context = {
    branch: "",
    dirtyEntries: [],
    dryRun: true,
    githubActions: true,
    eventName: "release",
    refName: "v1.0.0",
    refType: "tag",
    version: "1.0.0",
  };
  assert.deepEqual(validateRepositoryContext(context), []);
  assert.throws(
    () => validateRepositoryContext({ ...context, refName: "1.0.0" }),
    /must exactly match/,
  );
  assert.throws(
    () =>
      validateRepositoryContext({
        ...context,
        dirtyEntries: [" M package.json"],
      }),
    /must be clean/,
  );
});

test("local release inspection is dry-run only", () => {
  const messages = validateRepositoryContext({
    branch: "release/stable-1.0.0",
    dirtyEntries: [" M package.json"],
    dryRun: true,
    githubActions: false,
    version: "1.0.0",
  });
  assert.equal(messages.length, 2);
  assert.throws(
    () =>
      validateRepositoryContext({
        branch: "main",
        dirtyEntries: [],
        dryRun: false,
        githubActions: false,
        version: "1.0.0",
      }),
    /dry-run only/,
  );
});

test("registry and packed-file guards reject duplicates and substitutions", () => {
  assert.doesNotThrow(() => assertRegistryVersionAbsent(undefined, "1.0.0"));
  assert.throws(
    () => assertRegistryVersionAbsent("1.0.0", "1.0.0"),
    /already exists/,
  );
  assert.doesNotThrow(() =>
    validatePackedFiles(
      ["package.json", "dist/index.js"],
      ["dist/index.js", "package.json"],
    ),
  );
  assert.throws(
    () =>
      validatePackedFiles(
        ["package.json", "dist/index.js", "src/private.ts"],
        ["package.json", "dist/index.js"],
      ),
    /Unexpected packed files: src\/private\.ts/,
  );
});

test("release arguments and checksum output are deterministic", async () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {
    dryRun: true,
    outputDirectory: undefined,
  });
  assert.deepEqual(parseArguments(["--dry-run", "--output", "artifact"]), {
    dryRun: true,
    outputDirectory: "artifact",
  });
  assert.throws(() => parseArguments([]), /Usage:/);
  assert.throws(() => parseArguments(["--publish"]), /Usage:/);

  const directory = await mkdtemp(path.join(tmpdir(), "caret-checksum-"));
  const tarball = path.join(directory, releaseTarball);
  try {
    await writeFile(tarball, "verified artifact\n");
    const { checksumPath, digest } = await writeArtifactChecksum(tarball);
    assert.match(digest, /^[a-f0-9]{128}$/);
    assert.equal(
      await readFile(checksumPath, "utf8"),
      digest + "  " + releaseTarball + "\n",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("release verification installs the exact publication artifact", async () => {
  const source = await readFile(
    path.join(repositoryRoot, "scripts/verify-release.mjs"),
    "utf8",
  );
  assert.match(
    source,
    /const tarballPath[\s\S]+await verifyTarballConsumers\(tarballPath\)[\s\S]+writeArtifactChecksum\(tarballPath\)/,
  );
  assert.doesNotMatch(source, /runVisible\("npm", \["run", "test:package"\]\)/);
});

test("quality and browser workflows enforce the supported CI matrix", async () => {
  validateQualityWorkflow(await readWorkflow(".github/workflows/quality.yml"));
  validateBrowserWorkflow(await readWorkflow(".github/workflows/browsers.yml"));
});

test("release workflow separates verification from protected publication", async () => {
  validateReleaseWorkflow(await readWorkflow(".github/workflows/release.yml"));
});

test("release workflow validator rejects weakened trust boundaries", async () => {
  const workflow = await readWorkflow(".github/workflows/release.yml");
  const mutations = [
    (copy) => (copy.on.release.types = ["created"]),
    (copy) => delete copy.jobs.verify.if,
    (copy) => (copy.permissions = { "id-token": "write" }),
    (copy) => (copy.concurrency.group = "release-" + githubRef),
    (copy) => (copy.jobs.publish.environment = "unprotected"),
    (copy) => (copy.jobs.publish.permissions = { contents: "write" }),
    (copy) => copy.jobs.publish.steps.unshift({ uses: "actions/checkout@v7" }),
    (copy) => {
      const upload = copy.jobs.verify.steps.find((step) =>
        step.uses?.startsWith("actions/upload-artifact@"),
      );
      upload.with.name = "different-artifact";
    },
    (copy) => {
      const finalStep = copy.jobs.publish.steps.at(-1);
      finalStep.run = finalStep.run.replaceAll("latest", "alpha");
    },
    (copy) => {
      const finalStep = copy.jobs.publish.steps.at(-1);
      finalStep.run = finalStep.run.replace(
        releaseTarball,
        "nipe-solutions-caret-geometry-1.0.1.tgz",
      );
    },
    (copy) => {
      const finalStep = copy.jobs.publish.steps.at(-1);
      finalStep.run = finalStep.run.replace(
        "sha512sum --check --strict",
        "sha512sum --check",
      );
    },
  ];

  for (const mutate of mutations) {
    const copy = structuredClone(workflow);
    mutate(copy);
    assert.throws(() => validateReleaseWorkflow(copy));
  }
});

async function readWorkflow(relativePath) {
  return parse(await readFile(path.join(repositoryRoot, relativePath), "utf8"));
}

function stepsFor(job) {
  assert.ok(Array.isArray(job?.steps), "job must define executable steps");
  return job.steps;
}

function runCommands(job) {
  return stepsFor(job)
    .map((step) => step.run)
    .filter((command) => typeof command === "string");
}

function assertPinnedActions(workflow) {
  for (const job of Object.values(workflow.jobs)) {
    for (const step of stepsFor(job)) {
      if (step.uses) {
        assert.match(
          step.uses,
          /^[\w.-]+\/[\w.-]+@v\d+$/,
          step.uses + " must use an explicit major action version",
        );
      }
    }
  }
}

function assertCommonWorkflowPolicy(workflow) {
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assertPinnedActions(workflow);
  assert.equal(workflow.concurrency["cancel-in-progress"], true);
}

function validateQualityWorkflow(workflow) {
  assertCommonWorkflowPolicy(workflow);
  assert.equal(workflow.concurrency.group, "quality-" + githubRef);
  assert.deepEqual(Object.keys(workflow.jobs), ["check"]);
  const job = workflow.jobs.check;
  assert.equal(job["runs-on"], "ubuntu-24.04");
  assert.ok(job["timeout-minutes"] <= 30);
  const setupNode = stepsFor(job).find((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  );
  assert.equal(String(setupNode?.with?.["node-version"]), "24");
  assert.equal(setupNode?.with?.cache, "npm");
  assert.deepEqual(runCommands(job), ["npm ci", "npm run check"]);
}

function validateBrowserWorkflow(workflow) {
  assertCommonWorkflowPolicy(workflow);
  assert.equal(workflow.concurrency.group, "browsers-" + githubRef);
  assert.deepEqual(Object.keys(workflow.jobs).sort(), [
    "chromium",
    "firefox",
    "webkit",
  ]);
  for (const browser of ["chromium", "firefox", "webkit"]) {
    const job = workflow.jobs[browser];
    assert.equal(job["runs-on"], "ubuntu-24.04");
    assert.ok(job["timeout-minutes"] <= 30);
    const commands = runCommands(job);
    assert.ok(commands.includes("npm ci"));
    assert.ok(
      commands.includes("npx playwright install --with-deps " + browser),
    );
    assert.ok(
      commands.includes(
        "npm run test:browser -- --project=" +
          browser +
          " --reporter=line,html",
      ),
    );
    const artifact = stepsFor(job).find((step) =>
      step.uses?.startsWith("actions/upload-artifact@"),
    );
    assert.equal(artifact?.if, "failure()");
    assert.equal(artifact?.with?.name, "playwright-" + browser);
    assert.match(artifact?.with?.path ?? "", /playwright-report/);
    assert.match(artifact?.with?.path ?? "", /test-results/);
    assert.equal(artifact?.with?.["if-no-files-found"], "ignore");
    assert.ok(artifact?.with?.["retention-days"] <= 7);
  }
}

function validateReleaseWorkflow(workflow) {
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assertPinnedActions(workflow);
  assert.deepEqual(workflow.on, { release: { types: ["published"] } });
  assert.equal(
    workflow.concurrency.group,
    "npm-nipe-solutions-caret-geometry-stable",
  );
  assert.equal(workflow.concurrency["cancel-in-progress"], false);

  const verify = workflow.jobs.verify;
  const publish = workflow.jobs.publish;
  assert.equal(verify.if, "github.event.release.prerelease == false");
  assert.equal(verify["runs-on"], "ubuntu-24.04");
  assert.ok(verify["timeout-minutes"] <= 60);
  const checkout = stepsFor(verify).find((step) =>
    step.uses?.startsWith("actions/checkout@"),
  );
  assert.equal(checkout?.with?.["fetch-depth"], 0);
  assert.deepEqual(runCommands(verify), [
    "git merge-base --is-ancestor HEAD origin/main",
    "npm ci",
    "npm run check",
    "npx playwright install --with-deps chromium firefox webkit",
    "npm run test:browser",
    "npm run release:check -- --dry-run --output release-artifact",
  ]);
  const upload = stepsFor(verify).find((step) =>
    step.uses?.startsWith("actions/upload-artifact@"),
  );
  assert.equal(upload?.with?.name, "npm-package-stable");
  assert.equal(upload?.with?.path, "release-artifact");
  assert.equal(upload?.with?.["if-no-files-found"], "error");

  assert.equal(publish.needs, "verify");
  assert.equal(publish.environment, "npm");
  assert.deepEqual(publish.permissions, { "id-token": "write" });
  assert.ok(publish["timeout-minutes"] <= 10);
  assert.equal(
    stepsFor(publish).some((step) =>
      step.uses?.startsWith("actions/checkout@"),
    ),
    false,
  );
  const download = stepsFor(publish).find((step) =>
    step.uses?.startsWith("actions/download-artifact@"),
  );
  assert.equal(download?.with?.name, "npm-package-stable");
  const commands = runCommands(publish);
  assert.equal(commands.length, 1);
  const command = commands[0];
  assert.match(command, new RegExp(releaseTarball.replaceAll(".", "\\.")));
  assert.match(command, /RELEASE_CHANNEL.*latest/s);
  assert.match(command, /sha512sum --check --strict/);
  assert.match(command, /manifests=\(\*\.sha512\)/);
  assert.match(
    command,
    /npm publish --ignore-scripts --provenance --access public --tag/,
  );
}
