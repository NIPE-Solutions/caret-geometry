import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  createConsumerManifest,
  sanitizeNpmEnvironment,
  validatePackedFiles,
} from "./verify-package.mjs";

const expected = JSON.parse(
  await readFile(path.join(import.meta.dirname, "package-files.json"), "utf8"),
);

test("packed inventory rejects additions and omissions", () => {
  assert.doesNotThrow(() => validatePackedFiles(expected, expected));
  assert.throws(
    () => validatePackedFiles([...expected, "src/private.ts"], expected),
    /Unexpected packed files: src\/private\.ts/,
  );
  assert.throws(
    () => validatePackedFiles(expected.slice(1), expected),
    /Missing packed files: CHANGELOG\.md/,
  );
});

test("npm environment removes only allow-scripts case-insensitively", () => {
  const result = sanitizeNpmEnvironment({
    npm_config_allow_scripts: "false",
    NPM_CONFIG_USERCONFIG: "/tmp/npmrc",
    npm_config_registry: "https://registry.npmjs.org/",
    HTTPS_PROXY: "http://proxy.invalid",
  });
  assert.equal(result.npm_config_allow_scripts, undefined);
  assert.equal(result.NPM_CONFIG_USERCONFIG, "/tmp/npmrc");
  assert.equal(result.npm_config_registry, "https://registry.npmjs.org/");
  assert.equal(result.HTTPS_PROXY, "http://proxy.invalid");
});

test("consumer manifest neutralizes project-scoped script policy", () => {
  assert.deepEqual(createConsumerManifest(), {
    private: true,
    type: "module",
    allowScripts: {},
  });
});
