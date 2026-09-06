import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = mkdtempSync(join(tmpdir(), "caret-geometry-pack-"));
try {
  const json = execFileSync(
    "npm",
    ["pack", "--json", "--pack-destination", directory],
    { encoding: "utf8" },
  );
  const [pack] = JSON.parse(json);
  const names = pack.files.map((file) => file.path);
  for (const required of [
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.d.ts",
    "README.md",
    "LICENSE",
  ]) {
    if (!names.includes(required))
      throw new Error(`Package is missing ${required}`);
  }
  if (names.some((name) => /^(site|test|coverage|docs)\//.test(name)))
    throw new Error("Package contains non-runtime project files");
  if (pack.unpackedSize > 80_000)
    throw new Error(`Unpacked package exceeds 80 kB: ${pack.unpackedSize}`);
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  if (Object.keys(manifest.dependencies ?? {}).length)
    throw new Error("Runtime dependencies are not allowed");
  const consumer = join(directory, "consumer");
  mkdirSync(consumer);
  writeFileSync(join(consumer, "package.json"), '{"type":"module"}');
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(directory, pack.filename),
    ],
    {
      cwd: consumer,
      stdio: "ignore",
    },
  );
  const esm = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "import('@nipe-solutions/caret-geometry').then(m=>console.log(typeof m.getCaretRect))",
    ],
    { cwd: consumer, encoding: "utf8" },
  ).trim();
  const cjs = execFileSync(
    process.execPath,
    [
      "--input-type=commonjs",
      "--eval",
      "console.log(typeof require('@nipe-solutions/caret-geometry').getCaretRect)",
    ],
    { cwd: consumer, encoding: "utf8" },
  ).trim();
  if (esm !== "function" || cjs !== "function")
    throw new Error("Packed ESM/CJS consumer imports failed");
  console.log(
    `package ${pack.size} bytes compressed, ${pack.unpackedSize} bytes unpacked; ESM/CJS consumer imports passed`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
