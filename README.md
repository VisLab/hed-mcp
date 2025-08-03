# HED MCP TypeScript Server

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.16.0-green)](https://modelcontextprotocol.io/)

## Note
This MCP is awaiting the release of the hed-validator 4.1.0 dependency in order for the installation
and testing to work without using the local instructions. Further testing will proceed.

## Introduction
A Model Context Protocol (MCP) server for validating HED (Hierarchical Event Descriptor) data. This server provides comprehensive HED validation tools through the standardized MCP interface, making HED validation accessible to any MCP-compatible client.

## 🚀 Features

- **HED String Validation**: Validate individual HED tag strings against schema specifications
- **TSV File Validation**: Validate entire BIDS TSV files containing HED annotations
- **Sidecar Parsing**: Parse and validate HED sidecar JSON files
- **Multi-Schema Support**: Support for standard HED schemas and library schemas
- **Definition Processing**: Handle HED definitions for enhanced validation
- **Warning Detection**: Optional warning detection in addition to error reporting
- **Schema Caching**: Intelligent caching system for optimal performance
- **MCP Compliant**: Full compliance with Model Context Protocol specification

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Available Tools](#available-tools)
- [Configuration](#configuration)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install Dependencies

```bash
npm install
```

The server depends on the HED JavaScript validator library:

```bash
npm install https://github.com/hed-standard/hed-javascript.git
```

### Build the Server

```bash
npm run build
```

This creates the distribution files in the `dist/` directory.

## 🌐 Browser Usage

The HED MCP server can be used in browsers through several approaches:

### Option 1: Standalone HTML Validator

Open `browser-validator.html` directly in your browser for a complete HED validation interface with mock validation capabilities.

### Option 2: Browser Client Library

Include the browser client in your web application:

```html
<script src="browser-client.js"></script>
<script>
  // Create a validation form
  HEDUtils.createValidationForm('container-id');
  
  // Or use the client directly
  const client = new HEDBrowserClient();
  const result = await client.validateHedString('Event/Sensory-event, Red', '8.4.0');
</script>
```

### Option 3: HTTP API Server (Full Validation)

For complete validation capabilities in browsers, run the HTTP API server:

```bash
# Install additional dependencies
npm install express cors @types/express @types/cors

# Run HTTP server
npm run build
node dist/http-server.js

# Access at http://localhost:3000
```

**Browser Demo**: Open `browser-demo.html` to see all browser integration options in action.

## 🏁 Quick Start

### Run with MCP Inspector

The fastest way to test the server is using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

This opens a web interface where you can interact with the server and test all available tools.

### Basic Server Test

Test the server directly:

```bash
npm start
```

Or test with the included client:

```bash
node test-mcp-client.js
```

## 💡 Usage Examples

### Validate a HED String

```json
{
  "method": "tools/call",
  "params": {
    "name": "validateHedString",
    "arguments": {
      "hedString": "Event/Sensory-event, Red, Blue, (Green, Large)",
      "hedVersion": "8.4.0",
      "checkForWarnings": true
    }
  }
}
```

### Validate a TSV File

```json
{
  "method": "tools/call",
  "params": {
    "name": "validateHedTsv",
    "arguments": {
      "filePath": "/path/to/sub-01_task-rest_events.tsv",
      "hedVersion": "8.4.0",
      "checkForWarnings": true,
      "definitions": [
        "(Definition/Fixation, (Event/Sensory-event, (Onset)))",
        "(Definition/ButtonPress, (Action/Move, Agent/Human))"
      ]
    }
  }
}
```

### Parse a Sidecar File

```json
{
  "method": "tools/call",
  "params": {
    "name": "parseHedSidecar",
    "arguments": {
      "filePath": "/path/to/task-rest_events.json",
      "hedVersion": "8.4.0",
      "checkForWarnings": false
    }
  }
}
```

### Using Multiple Schemas

```json
{
  "arguments": {
    "hedString": "Event/Sensory-event, (Language-item, Nonsense-word)",
    "hedVersion": "8.4.0, lang_1.1.0",
    "checkForWarnings": true
  }
}
```

## 🛠 Available Tools

| Tool | Description | Required Parameters | Optional Parameters |
|------|-------------|-------------------|-------------------|
| `validateHedString` | Validates HED tag strings | `hedString`, `hedVersion` | `checkForWarnings`, `definitions` |
| `validateHedTsv` | Validates TSV files with HED | `filePath`, `hedVersion` | `checkForWarnings`, `fileData`, `jsonData`, `definitions` |
| `parseHedSidecar` | Parses HED sidecar JSON files | `filePath`, `hedVersion` | `checkForWarnings`, `fileData` |

### Supported HED Schema Versions

- **Standard schemas**: `8.3.0`, `8.4.0`, `8.5.0`
- **Library schemas**: `lang_1.1.0`, `score_2.1.0`, `testlib_2.0.0`
- **Multiple schemas**: `8.4.0, lang_1.1.0, score_2.1.0`

## ⚙️ Configuration

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "servers": {
    "hed-mcp": {
      "command": "node",
      "args": ["dist/server.js"],
      "cwd": "/path/to/hed-mcp-typescript"
    }
  }
}
```

### Environment Variables

The server respects standard Node.js environment variables:

- `NODE_ENV`: Set to `development` for verbose logging
- `DEBUG`: Enable debug output for troubleshooting

## 👨‍💻 Development

### Project Structure

```
src/
├── server.ts              # Main MCP server implementation
├── tools/                 # MCP tools (validation functions)
│   ├── validateHedString.ts
│   ├── validateHedTsv.ts
│   └── parseHedSidecar.ts
├── resources/             # MCP resources (schema info)
│   └── hedSchema.ts
├── utils/                 # Utility functions
│   ├── schemaCache.ts
│   ├── definitionProcessor.ts
│   ├── fileReader.ts
│   ├── issueFormatter.ts
│   └── mcpToZod.ts
└── types/                 # TypeScript type definitions
    └── index.ts
```

### Available Scripts

```bash
npm run build        # Build the TypeScript project
npm run dev          # Build in watch mode
npm run test         # Run the test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run clean        # Clean build artifacts
```

### Development Workflow

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd hed-mcp-typescript
   npm install
   ```

2. **Start development**:
   ```bash
   npm run dev  # Builds in watch mode
   ```

3. **Test your changes**:
   ```bash
   npm test
   ```

4. **Test with inspector**:
   ```bash
   npx @modelcontextprotocol/inspector node dist/server.js
   ```

## 📖 API Documentation

For detailed API documentation, see [API.md](./API.md).

Key concepts:

- **FormattedIssue**: Standardized error/warning format
- **HedValidationResult**: Standard validation response format
- **Schema Caching**: Automatic caching of loaded HED schemas
- **Definition Support**: Process and use HED definitions during validation

## 🧪 Testing

The project includes comprehensive tests covering:

- **Unit tests**: Individual function testing
- **Integration tests**: Tool interaction testing
- **Data validation**: Real HED data file testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch

# Run only integration tests
npm test -- --testPathPattern=integration
```

### Test Data

Test files are located in `tests/data/`:
- `sub-002_ses-1_task-FacePerception_run-1_events.tsv`
- `task-FacePerception_events.json`
- `participants_bad.json`
- `participants_bad.tsv`

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [HED Specification](https://hed-specification.readthedocs.io/)
- [HED JavaScript Library](https://github.com/hed-standard/hed-javascript)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [BIDS Specification](https://bids-specification.readthedocs.io/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/VisLab/hed-mcp-typescript/issues)
- **HED Community**: [HED Working Group](https://github.com/hed-standard)
- **Documentation**: [HED Documentation](https://hed-specification.readthedocs.io/)

---

**Made with ❤️ for the HED and BIDS communities**