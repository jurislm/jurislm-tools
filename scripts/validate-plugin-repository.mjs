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

function cleanShellToken(token) {
  return token.replace(/^["']+|["']+$/g, "");
}

function packageSpecsFromRunnerArgs(args) {
  const explicitPackages = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = cleanShellToken(args[index]);
    if (token === "--package" || token === "-p") {
      if (args[index + 1]) {
        explicitPackages.push(cleanShellToken(args[index + 1]));
        index += 1;
      }
    } else if (token.startsWith("--package=")) {
      explicitPackages.push(token.slice("--package=".length));
    } else if (token === "--") {
      if (explicitPackages.length > 0) {
        return explicitPackages;
      }
      if (args[index + 1]) {
        return [cleanShellToken(args[index + 1])];
      }
      return [];
    } else if (NPX_VALUE_OPTIONS.has(token)) {
      index += 1;
    } else if (!token.startsWith("-")) {
      return explicitPackages.length > 0 ? explicitPackages : [token];
    }
  }
  return explicitPackages;
}

function findNpmPackageLaunchers(server) {
  const launchers = [];
  const command = typeof server?.command === "string"
    ? path.basename(server.command)
    : undefined;
  const args = Array.isArray(server?.args)
    ? server.args.filter((value) => typeof value === "string")
    : [];

  if (command === "npx") {
    launchers.push(args);
  } else if (command === "npm" && (args[0] === "exec" || args[0] === "x")) {
    launchers.push(args.slice(1));
  }

  if (launchers.length > 0) {
    return launchers;
  }

  for (const commandText of collectStrings(server?.args)) {
    for (const segment of commandText.split(/(?:&&|\|\||[;&|\n\r])/)) {
      const tokens = segment.trim().split(/\s+/).filter(Boolean);
      for (let index = 0; index < tokens.length; index += 1) {
        const token = path.basename(cleanShellToken(tokens[index]));
        if (token === "npx") {
          launchers.push(tokens.slice(index + 1));
          break;
        }
        if (
          token === "npm" &&
          (tokens[index + 1] === "exec" || tokens[index + 1] === "x")
        ) {
          launchers.push(tokens.slice(index + 2));
          break;
        }
      }
    }
  }

  return launchers;
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

function validatePackageRunnerReferences(root, pluginPath, mcp, errors) {
  const mcpPath = path.join(pluginPath, ".mcp.json");
  if (!mcp || typeof mcp !== "object" || Array.isArray(mcp)) {
    return;
  }

  for (const [serverName, server] of Object.entries(mcp)) {
    for (const launcherArgs of findNpmPackageLaunchers(server)) {
      const packageSpecs = packageSpecsFromRunnerArgs(launcherArgs);
      if (packageSpecs.length === 0) {
        errors.push(
          `${relative(root, mcpPath)} server ${serverName}: npm package launcher has no package reference`,
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
}

function extractInstallationIds(markdown) {
  return new Set(
    [...markdown.matchAll(/\bclaude\s+plugin\s+install\s+([a-z0-9._-]+@[a-z0-9._-]+)/gi)]
      .map((match) => match[1]),
  );
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
  const marketplaceNames = new Set();
  const marketplaceSources = new Set();
  const expectedInstallationIds = new Set();

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

    if (marketplaceNames.has(entry.name)) {
      errors.push(`${entryLabel}: duplicate plugin name ${entry.name}`);
    }
    marketplaceNames.add(entry.name);

    const pluginPath = path.resolve(root, entry.source);
    if (pluginPath !== root && !pluginPath.startsWith(`${root}${path.sep}`)) {
      errors.push(`${entryLabel}: source path escapes the repository`);
      continue;
    }

    const normalizedSource = path.relative(root, pluginPath);
    if (marketplaceSources.has(normalizedSource)) {
      errors.push(`${entryLabel}: duplicate source path ${entry.source}`);
    }
    marketplaceSources.add(normalizedSource);
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
    validatePackageRunnerReferences(
      root,
      pluginPath,
      parsedJson.get(mcpPath),
      errors,
    );

    const installationId = `${entry.name}@${marketplaceName}`;
    expectedInstallationIds.add(installationId);

    const pluginReadmePath = path.join(pluginPath, "README.md");
    if (!existsSync(pluginReadmePath)) {
      errors.push(`${relative(root, pluginReadmePath)}: plugin README is missing`);
    } else {
      const pluginReadme = readFileSync(pluginReadmePath, "utf8");
      const pluginInstallationIds = extractInstallationIds(pluginReadme);
      if (!pluginInstallationIds.has(installationId)) {
        errors.push(
          `${relative(root, pluginReadmePath)}: missing installation identifier ${installationId}`,
        );
      }
      for (const documentedId of pluginInstallationIds) {
        if (documentedId !== installationId) {
          errors.push(
            `${relative(root, pluginReadmePath)}: unexpected installation identifier ${documentedId}`,
          );
        }
      }
    }
  }

  const documentedInstallationIds = extractInstallationIds(readme);
  for (const installationId of expectedInstallationIds) {
    if (!documentedInstallationIds.has(installationId)) {
      errors.push(`README.md: missing installation identifier ${installationId}`);
    }
  }
  for (const installationId of documentedInstallationIds) {
    if (!expectedInstallationIds.has(installationId)) {
      errors.push(`README.md: unexpected installation identifier ${installationId}`);
    }
  }

  const pluginsPath = path.join(root, "plugins");
  if (existsSync(pluginsPath)) {
    for (const entry of readdirSync(pluginsPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const pluginPath = path.join(pluginsPath, entry.name);
      const manifestPath = path.join(pluginPath, ".claude-plugin/plugin.json");
      if (
        existsSync(manifestPath) &&
        !marketplaceSources.has(path.relative(root, pluginPath))
      ) {
        errors.push(
          `${relative(root, manifestPath)}: plugin manifest is not listed in the marketplace`,
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
