# hed-mcp Copilot Instructions

This repository is on a Windows machine with PowerShell. ALL COMMANDS ARE FOR POWERSHELL (no `&&` chaining — use `;` instead). There is no Python virtual environment; this is a Node.js/TypeScript project managed with `npm`.

When you create summaries of what you did — always put them in a `.status/` directory at the root of the repository.

## Project Overview

**hed-mcp** is a TypeScript/Node.js Model Context Protocol (MCP) server for validating HED (Hierarchical Event Descriptor) data. It exposes HED validation capabilities as MCP tools and resources, accessible to any MCP-compatible client (e.g., AI assistants).

## Architecture Overview

**Entry Point:**
- `src/server.ts`: Main MCP server. Supports both stdio and WebSocket transports. Registers all tools and resources.

**Tools** (`src/tools/`):
- `validateHedString.ts`: Validates a single HED tag string against a schema version
- `validateHedSidecar.ts`: Parses and validates a BIDS JSON sidecar file
- `validateHedTsv.ts`: Validates a BIDS TSV events file (optionally with a sidecar)
- `getFileFromPath.ts`: Reads a file from the local filesystem by path

**Resources** (`src/resources/`):
- `hedSchema.ts`: MCP resource exposing HED schema information

**Shared Types** (`src/types/index.ts`):
- `FormattedIssue`, `HedValidationResult`, `DefinitionResult`, `ValidateHedSidecarResult`

**Utilities** (`src/utils/`):
- `schemaCache.ts`: Caches loaded HED schemas by version string to avoid redundant network/disk access
- `definitionProcessor.ts`: Converts definition strings into `DefinitionManager` objects for use during validation
- `issueFormatter.ts`: Normalizes raw HED `Issue` objects into `FormattedIssue` for MCP responses
- `fileReader.ts`: File reading helpers
- `mcpToZod.ts`: Converts MCP JSON Schema input definitions into Zod schemas for runtime validation

## Development Patterns

**Tool Pattern:**
Each tool exports:
1. A `Tool` definition object (MCP metadata + JSON Schema for inputs)
2. A Zod schema (generated via `mcpToZod`) for input validation
3. A `handle*` async function that performs the actual validation

**Schema Versioning:**
HED schema versions are strings like `"8.4.0"` or `"lang_1.1.0, score_2.1.0"` (comma-separated for library schemas). The `SchemaCache` normalizes and caches these.

## Common Commands (PowerShell)

```powershell
npm install           # Install dependencies
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm test              # Run all Jest tests
npm run test:coverage # Run tests with coverage report
npm start             # Start MCP server (stdio transport)
```

**Running individual test files:**
```powershell
npx jest tests/tools/validateHedString.test.ts
```

## Testing Structure

Tests live in `tests/` mirroring the `src/` structure. Jest is configured with `ts-jest` (ESM mode). Test data files are in `tests/data/`.

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

## Critical Dependencies

- **hed-validator**: Core HED validation and schema handling (npm package)
- **@modelcontextprotocol/sdk**: MCP server framework
- **zod**: Runtime input validation
- **TypeScript 5.8+**, **Node.js (ES2022 target)**

## File Organization

- `src/`: TypeScript source code
- `tests/`: Jest test suite
- `examples/`: Demo scripts and HTML client examples
- `dist/`: Compiled output (generated, not committed)
- `mcp-config.json`: MCP server configuration reference