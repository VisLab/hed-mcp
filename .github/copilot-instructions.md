# hed-mcp Copilot Instructions

> If `.status/local-environment.md` exists at the repo root, read it first — it contains
> machine-specific notes (OS, shell syntax, local paths) that override defaults here.

When you create summaries of what you did, always put them in a `.status/` directory at the root of the repository.

## Project overview

**hed-mcp** is a TypeScript/Node.js Model Context Protocol (MCP) server for validating HED (Hierarchical Event Descriptor) data. It exposes HED validation capabilities as MCP tools and resources, accessible to any MCP-compatible client (e.g., AI assistants).

- **Runtime:** Node.js (ES2022 target)
- **Language:** TypeScript 5.8+
- **Package manager:** npm (no yarn/pnpm)

## Build & test commands

Always run `npm install` (or `npm ci` in CI) before building or testing.

```sh
npm install               # Install dependencies
npm run build             # Clean (rimraf dist/) then compile TS → dist/
npm run dev               # Watch mode compilation
npm test                  # Run all Jest tests (interactive)
npm run test:ci           # Run all tests (non-interactive, CI mode)
npm run test:coverage     # Tests + coverage report (lcov + html in coverage/)
npm start                 # Start MCP server (stdio transport)
```

**Important notes:**
- `npm run build` automatically runs `prebuild` → `npm run clean` (deletes `dist/`) before compiling. Build output lands in `dist/` mirroring the project root: `dist/src/server.js`, `dist/examples/...`.
- Tests take ~4 seconds. Some tests load HED schemas over the network, so internet access is required.
- Run a single test file: `npx jest tests/tools/validateHedString.test.ts`

## CI / validation pipelines

All CI runs on **ubuntu-latest** with Node 22.x/24.x. To avoid CI failures, replicate these checks locally before pushing:

| Check | Workflow | How to run locally |
|-------|----------|--------------------|
| Build | `ci.yml` | `npm run build` — must succeed with no errors |
| Tests | `ci.yml` | `npm run test:ci` — all 142 tests must pass |
| Typos | `typos.yaml` | `npx typos --config .typos.toml` (or install [typos-cli](https://github.com/crate-ci/typos)) |
| Build artifact check | `ci.yml` | Verify `dist/src/server.js` exists after build |
| Security audit | `ci.yml` | `npm audit --audit-level=moderate` (allowed to fail) |
| Link checker | `links.yaml` | Weekly only; uses lychee with `lychee.toml` config |
| Coverage upload | `coverage.yml` | Push-to-main only; uploads `coverage/lcov.info` to qlty.sh |

Additional automation: `dependabot.yml` opens weekly PRs for npm + GitHub Actions updates. `maintenance.yml` runs `npm update` weekly.

## Architecture overview

**Entry point:**
- `src/server.ts`: Main MCP server. Supports both stdio and WebSocket transports. Registers all tools and resources.

**Tools** (`src/tools/`):
- `validateHedString.ts`: Validates a single HED tag string against a schema version
- `validateHedSidecar.ts`: Parses and validates a BIDS JSON sidecar file
- `validateHedTsv.ts`: Validates a BIDS TSV events file (optionally with a sidecar)
- `getFileFromPath.ts`: Reads a file from the local filesystem by path

**Resources** (`src/resources/`):
- `hedSchema.ts`: MCP resource exposing HED schema information

**Shared types** (`src/types/index.ts`):
- `FormattedIssue`, `HedValidationResult`, `DefinitionResult`, `ValidateHedSidecarResult`

**Utilities** (`src/utils/`):
- `schemaCache.ts`: Caches loaded HED schemas by version string to avoid redundant network/disk access
- `definitionProcessor.ts`: Converts definition strings into `DefinitionManager` objects for use during validation
- `issueFormatter.ts`: Normalizes raw HED `Issue` objects into `FormattedIssue` for MCP responses
- `fileReader.ts`: File reading helpers
- `mcpToZod.ts`: Converts MCP JSON Schema input definitions into Zod schemas for runtime validation

## Development patterns

**Tool pattern:**
Each tool exports:
1. A `Tool` definition object (MCP metadata + JSON Schema for inputs)
2. A Zod schema (generated via `mcpToZod`) for input validation
3. A `handle*` async function that performs the actual validation

**Schema versioning:**
HED schema versions are strings like `"8.4.0"` or `"lang_1.1.0, score_2.1.0"` (comma-separated for library schemas). The `SchemaCache` normalizes and caches these.

## Testing structure

Tests live in `tests/` mirroring the `src/` structure. Jest is configured with `ts-jest` (ESM mode via `jest.config.mjs`). Test data files are in `tests/data/`.

```
tests/
  basic.test.ts
  integration.test.ts
  tools/          # Tests for each tool
  utils/          # Tests for each utility
  resources/      # Tests for resources
  types/          # Tests for type definitions
  data/           # BIDS TSV/JSON test fixtures
```

## File organization

```
src/                  # TypeScript source
tests/                # Jest test suite
examples/             # Demo scripts and HTML client examples
dist/                 # Compiled output (git-ignored, generated by build)
.github/workflows/    # CI: ci.yml, coverage.yml, typos.yaml, links.yaml, release.yml, maintenance.yml
jest.config.mjs       # Jest config (ts-jest ESM preset)
tsconfig.json         # Main TS config (compiles src/ + examples/)
tsconfig.test.json    # Test TS config (extends main, adds tests/)
.typos.toml           # Typo checker config
lychee.toml           # Link checker config
mcp-config.json       # MCP server configuration reference
```

## Critical dependencies

- **hed-validator**: Core HED validation and schema handling (npm package)
- **@modelcontextprotocol/sdk**: MCP server framework
- **zod**: Runtime input validation

## Writing style

- In markdown files, only capitalize the first letter of headers (sentence case). Do not use title case.

Trust these instructions. Only search the repo if the information here is incomplete or found to be in error.