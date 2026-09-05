import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
  console.log(
    `package ${pack.size} bytes compressed, ${pack.unpackedSize} bytes unpacked`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
