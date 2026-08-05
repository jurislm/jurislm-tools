#!/usr/bin/env node

// Single definition of permitted Conventional Commits types (design D1).
// `release-please-config.json` and `CLAUDE.md` both derive from this list via
// the read/parse helpers below; `scripts/commit-types.test.mjs` asserts all
// three stay in sync so drift fails `npm test` instead of shipping silently.

import { readFileSync } from "node:fs";
import path from "node:path";

export const PERMITTED_COMMIT_TYPES = Object.freeze(["feat", "fix", "docs", "chore"]);

function resolvePath(relativeOrAbsolutePath, root) {
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(root, relativeOrAbsolutePath);
}

/**
 * Reads the commit types declared in `release-please-config.json`'s
 * `changelog-sections`, in declaration order.
 */
export function readReleasePleaseChangelogTypes(
  configPath = "release-please-config.json",
  root = process.cwd(),
) {
  const absolutePath = resolvePath(configPath, root);
  const config = JSON.parse(readFileSync(absolutePath, "utf8"));
  const sections = config?.packages?.["."]?.["changelog-sections"];

  if (!Array.isArray(sections)) {
    throw new Error(`Missing packages["."].changelog-sections in ${configPath}`);
  }

  return sections.map((section) => section.type);
}

/**
 * Parses the commit types declared in CLAUDE.md's prose "Commit types:"
 * bullet list, e.g.:
 *
 *   Commit types:
 *
 *   - `feat:` for new or materially expanded plugin behavior.
 *   - `fix:` for incorrect behavior or information.
 *   - `docs:` or `chore:` for non-behavioral maintenance.
 *
 * This intentionally parses the existing human-readable prose rather than
 * requiring a machine-readable block (design D1) — every backtick-quoted
 * `type:` token inside the bullet list is collected, in document order.
 */
export function parseClaudeMdCommitTypes(claudeMdPath = "CLAUDE.md", root = process.cwd()) {
  const absolutePath = resolvePath(claudeMdPath, root);
  const text = readFileSync(absolutePath, "utf8");
  const marker = "Commit types:";
  const occurrences = text.split(marker).length - 1;

  if (occurrences === 0) {
    throw new Error(`Missing "${marker}" section in ${claudeMdPath}`);
  }

  if (occurrences > 1) {
    // A second heading means indexOf would silently pick the first one and
    // ignore the rest — worse than a missing section, because nothing here
    // would ever notice the parse target became ambiguous. Fail loudly
    // instead of guessing which occurrence is authoritative.
    throw new Error(
      `"${marker}" appears ${occurrences} times in ${claudeMdPath}; the parse target is ` +
        "ambiguous. Keep exactly one such heading in this file.",
    );
  }

  const markerIndex = text.indexOf(marker);
  const lines = text.slice(markerIndex + marker.length).split("\n");
  const types = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("- ")) {
      inList = true;
      for (const match of line.matchAll(/`([a-z]+):`/g)) {
        types.push(match[1]);
      }
      continue;
    }

    if (inList) {
      // Blank line or next paragraph after the bullet list: the list is over.
      break;
    }

    if (line.length > 0) {
      // Non-bullet, non-blank content before any bullet was seen — the
      // section is not shaped as expected.
      break;
    }
  }

  if (types.length === 0) {
    throw new Error(`No commit types parsed from "${marker}" section in ${claudeMdPath}`);
  }

  return types;
}
