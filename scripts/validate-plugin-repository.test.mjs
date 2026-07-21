import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { validateRepository } from "./validate-plugin-repository.mjs";

const roots = [];

test.afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeJson(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "plugin-repository-"));
  roots.push(root);

  writeJson(root, ".claude-plugin/marketplace.json", {
    name: "test-market",
    description: "Test marketplace",
    plugins: [
      {
        name: "coolify",
        source: "./plugins/coolify",
        description: "Manage Coolify",
        version: "1.0.0",
      },
    ],
  });
  writeJson(root, "plugins/coolify/.claude-plugin/plugin.json", {
    name: "coolify",
    version: "1.0.0",
    description: "Manage Coolify",
    author: { name: "Test" },
  });
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "zsh",
      args: [
        "-lc",
        'API_TOKEN="$API_TOKEN" npx -y @jurislm/coolify-mcp@1.2.3',
      ],
    },
  });
  writeFileSync(
    path.join(root, "plugins/coolify/README.md"),
    "# Coolify\n\n`claude plugin install coolify@test-market`\n",
  );
  writeFileSync(
    path.join(root, "README.md"),
    "# Test\n\n`claude plugin install coolify@test-market`\n",
  );

  return root;
}

test("accepts a structurally consistent repository", () => {
  const root = createFixture();

  assert.deepEqual(validateRepository(root), []);
});

test("rejects mutable credential-bearing npm references", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "zsh",
      args: [
        "-lc",
        'API_TOKEN="$API_TOKEN" npx -y @jurislm/coolify-mcp@latest',
      ],
    },
  });

  assert.match(validateRepository(root).join("\n"), /exact semantic version/);
});

test("recognizes bare credential variable names", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "zsh",
      args: ["-lc", 'TOKEN="$TOKEN" npx -y coolify-mcp@latest'],
    },
  });

  assert.match(validateRepository(root).join("\n"), /exact semantic version/);
});

test("validates each credential-bearing MCP server independently", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    safe: {
      command: "zsh",
      args: [
        "-lc",
        'SAFE_TOKEN="$SAFE_TOKEN" npx -y @jurislm/coolify-mcp@1.2.3',
      ],
    },
    unsafe: {
      command: "zsh",
      args: ["-lc", 'UNSAFE_TOKEN="$UNSAFE_TOKEN" npx -y @jurislm/unsafe'],
    },
  });

  assert.match(
    validateRepository(root).join("\n"),
    /@jurislm\/unsafe must use an exact semantic version/,
  );
});

test("recognizes credential and PAT variable names", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    credential: {
      command: "zsh",
      args: [
        "-lc",
        'API_CREDENTIAL="$API_CREDENTIAL" npx -y @jurislm/unsafe@latest',
      ],
    },
    pat: {
      command: "zsh",
      args: ["-lc", 'GITHUB_PAT="$GITHUB_PAT" npx -y unsafe@latest'],
    },
  });

  const errors = validateRepository(root);
  assert.equal(errors.filter((error) => /exact semantic version/.test(error)).length, 2);
});

test("rejects mixed pinned and unversioned npx package options", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "zsh",
      args: [
        "-lc",
        'API_TOKEN="$API_TOKEN" npx --package @jurislm/mutable --package @jurislm/pinned@1.2.3 run',
      ],
    },
  });

  assert.match(
    validateRepository(root).join("\n"),
    /@jurislm\/mutable must use an exact semantic version/,
  );
});

test("rejects marketplace and manifest name mismatches", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.claude-plugin/plugin.json", {
    name: "wrong-name",
    version: "1.0.0",
    description: "Manage Coolify",
    author: { name: "Test" },
  });

  assert.match(validateRepository(root).join("\n"), /manifest name/);
});

test("rejects missing marketplace source paths", () => {
  const root = createFixture();
  const marketplacePath = path.join(root, ".claude-plugin/marketplace.json");
  const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  marketplace.plugins[0].source = "./plugins/missing";
  writeJson(root, ".claude-plugin/marketplace.json", marketplace);

  assert.match(validateRepository(root).join("\n"), /source path/);
});

test("reports malformed repository JSON", () => {
  const root = createFixture();
  writeFileSync(path.join(root, "plugins/coolify/.mcp.json"), "{broken\n");

  assert.match(validateRepository(root).join("\n"), /invalid JSON/);
});

test("ignores local Claude worktrees outside repository content", () => {
  const root = createFixture();
  const worktreePath = path.join(root, ".claude/worktrees/other");
  mkdirSync(worktreePath, { recursive: true });
  writeFileSync(path.join(worktreePath, "broken.json"), "{broken\n");

  assert.deepEqual(validateRepository(root), []);
});

test("rejects reversed marketplace installation identifiers", () => {
  const root = createFixture();
  writeFileSync(
    path.join(root, "README.md"),
    "# Test\n\n`claude plugin install test-market@coolify`\n",
  );

  assert.match(validateRepository(root).join("\n"), /coolify@test-market/);
});

test("rejects reversed installation identifiers in plugin README files", () => {
  const root = createFixture();
  writeFileSync(
    path.join(root, "plugins/coolify/README.md"),
    "# Coolify\n\n`claude plugin install test-market@coolify`\n",
  );

  assert.match(
    validateRepository(root).join("\n"),
    /plugins\/coolify\/README\.md.*coolify@test-market/,
  );
});
