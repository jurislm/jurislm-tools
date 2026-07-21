#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EXACT_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const CREDENTIAL_NAME = /\b(?:[A-Z][A-Z0-9_]*_)?(?:TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL|PAT)\b/;
const NPX_VALUE_OPTIONS = new Set([
  "--cache",
  "--call",
  "--node-options",
  "--registry",
  "--userconfig",
  "-c",
]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules"]);
const IGNORED_RELATIVE_DIRECTORIES = new Set([
  path.join(".claude", "worktrees"),
]);

function relative(root, filePath) {
  return path.relative(root, filePath) || ".";
}

function listJsonFiles(root) {
  const files = [];

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const entryPath = path.join(directory, entry.name);
      if (
        entry.isDirectory() &&
        IGNORED_RELATIVE_DIRECTORIES.has(path.relative(root, entryPath))
      ) {
        continue;
      }
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(entryPath);
      }
    }
  }

  visit(root);
  return files;
}

function readJson(root, filePath, errors) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${relative(root, filePath)}: invalid JSON (${error.message})`);
    return undefined;
  }
}

function collectStrings(value) {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function findNpxPackageSpecs(server) {
  const specs = [];

  for (const command of collectStrings(server)) {
    const tokens = command.trim().split(/\s+/);
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index] !== "npx") {
        continue;
      }

      const explicitPackages = [];
      for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
        const token = tokens[cursor];
        if (token === "--package" || token === "-p") {
          if (tokens[cursor + 1]) {
            explicitPackages.push(tokens[cursor + 1]);
            cursor += 1;
          }
        } else if (token.startsWith("--package=")) {
          explicitPackages.push(token.slice("--package=".length));
        }
      }
      if (explicitPackages.length > 0) {
        specs.push(...explicitPackages);
        continue;
      }

      for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
        const token = tokens[cursor];
        if (NPX_VALUE_OPTIONS.has(token)) {
          cursor += 1;
        } else if (!token.startsWith("-")) {
          specs.push(token);
          break;
        }
      }
    }
  }

  return specs;
}

function splitPackageSpec(spec) {
  const separator = spec.lastIndexOf("@");
  if (separator <= 0) {
    return { packageName: spec, version: undefined };
  }
  return {
    packageName: spec.slice(0, separator),
    version: spec.slice(separator + 1),
  };
}

function validateCredentialPackageReferences(root, pluginPath, mcp, errors) {
  const mcpPath = path.join(pluginPath, ".mcp.json");
  if (!mcp || typeof mcp !== "object" || Array.isArray(mcp)) {
    return;
  }

  for (const [serverName, server] of Object.entries(mcp)) {
    const launcher = collectStrings(server).join(" ");
    if (!CREDENTIAL_NAME.test(launcher) || !launcher.includes("npx")) {
      continue;
    }

    const packageSpecs = findNpxPackageSpecs(server);
    if (packageSpecs.length === 0) {
      errors.push(
        `${relative(root, mcpPath)} server ${serverName}: credential-bearing npx launcher has no versioned package reference`,
      );
      continue;
    }

    for (const spec of packageSpecs) {
      const { version } = splitPackageSpec(spec);
      if (!version || !EXACT_SEMVER.test(version)) {
        errors.push(
          `${relative(root, mcpPath)} server ${serverName}: ${spec} must use an exact semantic version`,
        );
      }
    }
  }
}

export function validateRepository(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const errors = [];
  const parsedJson = new Map();

  for (const filePath of listJsonFiles(root)) {
    parsedJson.set(filePath, readJson(root, filePath, errors));
  }

  const marketplacePath = path.join(root, ".claude-plugin/marketplace.json");
  if (!existsSync(marketplacePath)) {
    errors.push(".claude-plugin/marketplace.json: marketplace file is missing");
    return errors;
  }

  const marketplace = parsedJson.get(marketplacePath);
  if (!marketplace) {
    return errors;
  }

  if (typeof marketplace.name !== "string" || marketplace.name.length === 0) {
    errors.push(".claude-plugin/marketplace.json: marketplace name is missing");
  }
  if (
    typeof marketplace.description !== "string" ||
    marketplace.description.length === 0
  ) {
    errors.push(".claude-plugin/marketplace.json: marketplace description is missing");
  }
  if (!Array.isArray(marketplace.plugins)) {
    errors.push(".claude-plugin/marketplace.json: plugins must be an array");
    return errors;
  }

  const readmePath = path.join(root, "README.md");
  const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
  const marketplaceName = marketplace.name;

  for (const [index, entry] of marketplace.plugins.entries()) {
    const entryLabel = `.claude-plugin/marketplace.json plugins[${index}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${entryLabel}: entry must be an object`);
      continue;
    }
    if (typeof entry.name !== "string" || entry.name.length === 0) {
      errors.push(`${entryLabel}: name is missing`);
      continue;
    }
    if (typeof entry.source !== "string" || entry.source.length === 0) {
      errors.push(`${entryLabel}: source must be a local path string`);
      continue;
    }

    const pluginPath = path.resolve(root, entry.source);
    if (pluginPath !== root && !pluginPath.startsWith(`${root}${path.sep}`)) {
      errors.push(`${entryLabel}: source path escapes the repository`);
      continue;
    }
    if (!existsSync(pluginPath) || !statSync(pluginPath).isDirectory()) {
      errors.push(`${entryLabel}: source path ${entry.source} does not exist`);
      continue;
    }

    const folderName = path.basename(pluginPath);
    if (folderName !== entry.name) {
      errors.push(
        `${entryLabel}: folder name ${folderName} does not match entry name ${entry.name}`,
      );
    }

    const manifestPath = path.join(pluginPath, ".claude-plugin/plugin.json");
    if (!existsSync(manifestPath)) {
      errors.push(
        `${entryLabel}: plugin manifest ${relative(root, manifestPath)} is missing`,
      );
      continue;
    }

    const manifest = parsedJson.get(manifestPath);
    if (manifest && manifest.name !== entry.name) {
      errors.push(
        `${relative(root, manifestPath)}: manifest name ${String(manifest.name)} does not match marketplace entry ${entry.name}`,
      );
    }

    const mcpPath = path.join(pluginPath, ".mcp.json");
    validateCredentialPackageReferences(
      root,
      pluginPath,
      parsedJson.get(mcpPath),
      errors,
    );

    const installationId = `${entry.name}@${marketplaceName}`;
    if (!readme.includes(installationId)) {
      errors.push(`README.md: missing installation identifier ${installationId}`);
    }

    const pluginReadmePath = path.join(pluginPath, "README.md");
    if (!existsSync(pluginReadmePath)) {
      errors.push(`${relative(root, pluginReadmePath)}: plugin README is missing`);
    } else {
      const pluginReadme = readFileSync(pluginReadmePath, "utf8");
      if (!pluginReadme.includes(installationId)) {
        errors.push(
          `${relative(root, pluginReadmePath)}: missing installation identifier ${installationId}`,
        );
      }
    }
  }

  return errors;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const errors = validateRepository(root);
  if (errors.length > 0) {
    console.error("Plugin repository validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Plugin repository validation passed");
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entryPath) {
  main();
}
