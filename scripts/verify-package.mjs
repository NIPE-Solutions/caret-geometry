import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import console from "node:console";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..");
const packageName = "@nipe-solutions/caret-geometry";
const approvedPackedFiles = JSON.parse(
  await readFile(path.join(import.meta.dirname, "package-files.json"), "utf8"),
);

export function validatePackedFiles(actualFiles, expectedFiles) {
  const actual = [...actualFiles].sort();
  const expected = [...expectedFiles].sort();
  const unexpected = actual.filter((file) => !expected.includes(file));
  const missing = expected.filter((file) => !actual.includes(file));
  const messages = [];

  if (unexpected.length > 0) {
    messages.push("Unexpected packed files: " + unexpected.join(", "));
  }
  if (missing.length > 0) {
    messages.push("Missing packed files: " + missing.join(", "));
  }

  assert.deepEqual(
    actual,
    expected,
    messages.join("\n") || "Packed file inventory differs from its allowlist",
  );
}

export function sanitizeNpmEnvironment(environment) {
  const sanitized = Object.fromEntries(
    Object.entries(environment).filter(
      ([name]) => name.toLowerCase() !== "npm_config_allow_scripts",
    ),
  );
  return {
    ...sanitized,
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
  };
}

export function createConsumerManifest() {
  return {
    private: true,
    type: "module",
    allowScripts: {},
  };
}

export async function verifyPackage() {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "caret-geometry-package-"),
  );
  try {
    const packDirectory = path.join(temporaryRoot, "pack");
    await mkdir(packDirectory);
    const { stdout } = await run("npm", [
      "pack",
      "--json",
      "--pack-destination",
      packDirectory,
    ]);
    const [pack] = JSON.parse(stdout);
    assert.ok(pack, "npm pack did not report an artifact");
    validatePackedFiles(
      pack.files.map(({ path: file }) => file),
      approvedPackedFiles,
    );
    assert.ok(
      pack.size <= 16_000,
      "Compressed package exceeds 16,000 bytes: " + pack.size,
    );
    assert.ok(
      pack.unpackedSize <= 64_000,
      "Unpacked package exceeds 64,000 bytes: " + pack.unpackedSize,
    );

    const manifest = JSON.parse(
      await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
    );
    assert.deepEqual(
      manifest.dependencies ?? {},
      {},
      "Runtime dependencies are not allowed",
    );

    const tarballPath = path.join(packDirectory, pack.filename);
    await verifyTarballConsumers(tarballPath);

    console.log(
      "Packed package verification passed (" +
        pack.entryCount +
        " files, " +
        pack.size +
        " bytes compressed, " +
        pack.unpackedSize +
        " bytes unpacked)",
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function verifyTarballConsumers(tarballPath) {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "caret-geometry-consumer-"),
  );
  try {
    await writeFile(
      path.join(temporaryRoot, "package.json"),
      JSON.stringify(createConsumerManifest(), null, 2) + "\n",
    );
    await run(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--no-package-lock",
        "--save-exact",
        path.resolve(tarballPath),
      ],
      temporaryRoot,
    );

    await verifyModulesAndServerImport(temporaryRoot);
    await verifyTypes(temporaryRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function verifyModulesAndServerImport(consumer) {
  const esm = await run(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `
        if (globalThis.document !== undefined) {
          throw new Error('DOM globals must not be installed for the server import')
        }
        const api = await import('${packageName}')
        for (const name of [
          'getCaretRect',
          'createCaretVirtualElement',
          'observeCaretGeometry',
          'InvalidCaretPositionError',
          'UnsupportedCaretTargetError',
          'UnsupportedInputTypeError',
        ]) {
          if (typeof api[name] !== 'function') {
            throw new Error('ESM export is missing ' + name)
          }
        }
      `,
    ],
    consumer,
  );
  assert.equal(esm.stderr, "");

  const cjs = await run(
    process.execPath,
    [
      "--input-type=commonjs",
      "--eval",
      `
        const api = require('${packageName}')
        for (const name of [
          'getCaretRect',
          'createCaretVirtualElement',
          'observeCaretGeometry',
        ]) {
          if (typeof api[name] !== 'function') {
            throw new Error('CommonJS export is missing ' + name)
          }
        }
      `,
    ],
    consumer,
  );
  assert.equal(cjs.stderr, "");
}

async function verifyTypes(consumer) {
  await writeFile(
    path.join(consumer, "index.ts"),
    `
      import {
        createCaretVirtualElement,
        getCaretRect,
        observeCaretGeometry,
        type EditableCaretOptions,
        type RangeCaretOptions,
        type SelectionCaretOptions,
        type TextControlCaretOptions,
      } from '${packageName}'

      declare const input: HTMLInputElement
      declare const range: Range
      declare const selection: Selection
      declare const editable: HTMLElement

      getCaretRect(input, { position: 1 } satisfies TextControlCaretOptions)
      getCaretRect(range, { edge: 'end' } satisfies RangeCaretOptions)
      getCaretRect(selection, { edge: 'anchor' } satisfies SelectionCaretOptions)
      getCaretRect(editable, { edge: 'focus' } satisfies EditableCaretOptions)
      createCaretVirtualElement(range, { markerFallback: 'never' })
      observeCaretGeometry(selection, () => {}, { edge: 'focus' })

      // @ts-expect-error Range targets do not accept Selection edges.
      getCaretRect(range, { edge: 'focus' })
      // @ts-expect-error Text controls do not accept marker fallback.
      getCaretRect(input, { markerFallback: 'never' })
      // @ts-expect-error Selection targets do not accept explicit positions.
      observeCaretGeometry(selection, () => {}, { position: 1 })
    `,
  );
  await writeFile(
    path.join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        include: ["index.ts"],
      },
      null,
      2,
    ) + "\n",
  );

  await run(
    process.execPath,
    [
      path.join(repositoryRoot, "node_modules/typescript/bin/tsc"),
      "--project",
      "tsconfig.json",
    ],
    consumer,
  );
}

function run(command, args, cwd = repositoryRoot) {
  return execFileAsync(command, args, {
    cwd,
    env: sanitizeNpmEnvironment(process.env),
    maxBuffer: 10 * 1024 * 1024,
  });
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  try {
    await verifyPackage();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
