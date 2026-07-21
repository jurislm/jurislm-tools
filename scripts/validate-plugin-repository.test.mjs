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

test("accepts structured npx command and args with an exact unscoped version", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "npx",
      args: ["-y", "coolify-mcp@1.2.3"],
      env: { API_TOKEN: "${API_TOKEN}" },
    },
  });

  assert.deepEqual(validateRepository(root), []);
});

test("keeps separate shell package-runner invocations isolated", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "zsh",
      args: [
        "-lc",
        "npx @jurislm/mutable ; npx --package @jurislm/pinned@1.2.3 run",
      ],
    },
  });

  assert.match(
    validateRepository(root).join("\n"),
    /@jurislm\/mutable must use an exact semantic version/,
  );
});

test("treats newline and background operators as shell boundaries", () => {
  for (const separator of ["\n", " & "]) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", {
      coolify: {
        command: "zsh",
        args: [
          "-lc",
          `npx @jurislm/mutable${separator}npx --package @jurislm/pinned@1.2.3 run`,
        ],
      },
    });

    assert.match(
      validateRepository(root).join("\n"),
      /@jurislm\/mutable must use an exact semantic version/,
    );
  }
});

test("rejects mutable npm exec packages", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "npm",
      args: ["exec", "coolify-mcp@latest"],
    },
  });

  assert.match(validateRepository(root).join("\n"), /exact semantic version/);
});

test("finds npm exec after global options in structured and shell forms", () => {
  const servers = [
    { command: "npm", args: ["--silent", "exec", "unsafe@latest"] },
    {
      command: "zsh",
      args: ["-lc", "npm --silent exec unsafe@latest"],
    },
  ];

  for (const server of servers) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", { coolify: server });
    assert.match(validateRepository(root).join("\n"), /exact semantic version/);
  }
});

test("accepts backslash-newline continuation before an exact package", () => {
  const root = createFixture();
  writeJson(root, "plugins/coolify/.mcp.json", {
    coolify: {
      command: "zsh",
      args: ["-lc", "npx \\\n@jurislm/coolify-mcp@1.2.3"],
    },
  });

  assert.deepEqual(validateRepository(root), []);
});

test("rejects mutable packages from equivalent package runners", () => {
  const runners = [
    { command: "pnpm", args: ["dlx", "unsafe@latest"] },
    { command: "yarn", args: ["dlx", "unsafe@latest"] },
    { command: "bunx", args: ["unsafe@latest"] },
    { command: "bun", args: ["x", "unsafe@latest"] },
  ];

  for (const runner of runners) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", { coolify: runner });
    assert.match(validateRepository(root).join("\n"), /exact semantic version/);
  }
});

test("uses runner-specific global options and option arity", () => {
  const servers = [
    { command: "pnpm", args: ["--silent", "dlx", "unsafe@latest"] },
    { command: "yarn", args: ["--silent", "dlx", "unsafe@latest"] },
    { command: "bun", args: ["--silent", "x", "unsafe@latest"] },
    { command: "pnpm", args: ["dlx", "-c", "unsafe@latest", "safe@1.2.3"] },
    {
      command: "zsh",
      args: ["-lc", "pnpm --silent dlx unsafe@latest"],
    },
    {
      command: "zsh",
      args: ["-lc", "bun --silent x unsafe@latest"],
    },
  ];

  for (const server of servers) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", { coolify: server });
    assert.match(validateRepository(root).join("\n"), /exact semantic version/);
  }
});

test("fails closed on unsupported runner options before a package", () => {
  const servers = [
    {
      command: "npm",
      args: [
        "exec",
        "--globalconfig",
        "cache@1.2.3",
        "@scope/mcp@latest",
      ],
    },
    {
      command: "npx",
      args: ["--unknown-option", "cache@1.2.3", "@scope/mcp@latest"],
    },
  ];

  for (const server of servers) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", { coolify: server });
    assert.notDeepEqual(validateRepository(root), []);
  }
});

test("rejects invalid semver strings that npm can treat as tags", () => {
  for (const version of ["1.2.3-...", "1.2.3-foo..bar", "01.2.3", "1.2.3-01"]) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", {
      coolify: { command: "npx", args: ["-y", `unsafe@${version}`] },
    });
    assert.match(validateRepository(root).join("\n"), /exact semantic version/);
  }
});

test("validates package runners nested in call payloads", () => {
  const servers = [
    {
      command: "npx",
      args: [
        "--package",
        "safe@1.2.3",
        "-c",
        "npx unsafe@latest",
      ],
    },
    {
      command: "zsh",
      args: [
        "-lc",
        'npx --package safe@1.2.3 -c "npx unsafe@latest"',
      ],
    },
    {
      command: "zsh",
      args: [
        "-lc",
        'npx --package safe@1.2.3 --call="npx unsafe@latest"',
      ],
    },
  ];

  for (const server of servers) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", { coolify: server });
    assert.match(
      validateRepository(root).join("\n"),
      /unsafe@latest must use an exact semantic version/,
    );
  }
});

test("validates package runners nested in shell interpreters and eval", () => {
  const commands = [
    `sh -c 'npx unsafe@latest'`,
    `zsh -lc "bash -c 'npx unsafe@latest'"`,
    `bash -O extglob -c "npx unsafe@latest"`,
    `bash --rcfile /dev/null -c "npx unsafe@latest"`,
    `eval 'npx unsafe@latest'`,
  ];

  for (const command of commands) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", {
      coolify: { command: "zsh", args: ["-lc", command] },
    });
    assert.match(validateRepository(root).join("\n"), /exact semantic version/);
  }
});

test("inspects repository-local launcher scripts", () => {
  const servers = [
    { command: "./launch.sh", env: { API_TOKEN: "${API_TOKEN}" } },
    {
      command: "zsh",
      args: ["-lc", "./launch.sh"],
      env: { API_TOKEN: "${API_TOKEN}" },
    },
  ];

  for (const server of servers) {
    const root = createFixture();
    writeFileSync(
      path.join(root, "plugins/coolify/launch.sh"),
      "#!/bin/sh\nexec npx unsafe@latest\n",
    );
    writeJson(root, "plugins/coolify/.mcp.json", { coolify: server });
    assert.match(validateRepository(root).join("\n"), /exact semantic version/);
  }
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

test("rejects non-object MCP document roots", () => {
  for (const value of [null, [], "invalid"]) {
    const root = createFixture();
    writeJson(root, "plugins/coolify/.mcp.json", value);
    assert.match(validateRepository(root).join("\n"), /root must be an object/);
  }
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

test("rejects installation identifiers with marketplace suffix typos", () => {
  const root = createFixture();
  writeFileSync(
    path.join(root, "README.md"),
    "# Test\n\n`claude plugin install coolify@test-market-old`\n",
  );

  const errors = validateRepository(root).join("\n");
  assert.match(errors, /missing installation identifier coolify@test-market/);
  assert.match(errors, /unexpected installation identifier coolify@test-market-old/);
});

test("rejects installation identifiers with invalid trailing path text", () => {
  const root = createFixture();
  writeFileSync(
    path.join(root, "README.md"),
    "# Test\n\n`claude plugin install coolify@test-market/typo`\n",
  );

  const errors = validateRepository(root).join("\n");
  assert.match(errors, /missing installation identifier coolify@test-market/);
  assert.match(errors, /unexpected installation identifier coolify@test-market\/typo/);
});

test("rejects plugin manifests and docs left behind after entry removal", () => {
  const root = createFixture();
  const marketplacePath = path.join(root, ".claude-plugin/marketplace.json");
  const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  marketplace.plugins = [];
  writeJson(root, ".claude-plugin/marketplace.json", marketplace);

  const errors = validateRepository(root).join("\n");
  assert.match(errors, /unexpected installation identifier coolify@test-market/);
  assert.match(errors, /plugin manifest is not listed in the marketplace/);
});

test("rejects duplicate marketplace names and sources", () => {
  const root = createFixture();
  const marketplacePath = path.join(root, ".claude-plugin/marketplace.json");
  const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  marketplace.plugins.push({ ...marketplace.plugins[0] });
  writeJson(root, ".claude-plugin/marketplace.json", marketplace);

  const errors = validateRepository(root).join("\n");
  assert.match(errors, /duplicate plugin name coolify/);
  assert.match(errors, /duplicate source path/);
});
