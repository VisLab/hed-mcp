# HED MCP Examples

This directory contains various examples and tools for working with the HED MCP (Model Context Protocol) server. These examples demonstrate different ways to interact with the HED validation system.

## 📁 Files Overview

### Browser-based examples
```javascript
const validator = new HEDValidatorClient({
    serverEndpoint: '/api',          // API endpoint base path
    timeout: 10000,                  // Request timeout in ms
    retries: 3,                      // Number of retry attempts
    fallbackToMock: true             // Use mock if server fails
});
```es
- **`hed-validator.html`** - Full-featured browser interface for HED validation
- **`hed-demo.html`** - Interactive demo and integration guide  
- **`hed-validator-client.js`** - Modern browser client for HED validation
- **`hed-validator.css`** - Clean, responsive styles for the browser interface

### MCP Integration Examples
- **`mcp-client.js`** - Interactive MCP client demonstrating full protocol usage
- **`test-server.js`** - Automated server testing and validation scenarios

### Development Examples  
- **`definition-usage.ts`** - TypeScript example showing HED definition processing

---

## 🌐 Browser Examples

### HED Validator Interface (`hed-validator.html`)

A complete, production-ready web interface for HED validation featuring:

- **HED String Validation** - Validate individual HED strings with syntax highlighting
- **TSV File Validation** - Validate tab-separated event files 
- **Sidecar JSON Validation** - Validate BIDS sidecar files
- **Multiple HED Versions** - Support for different HED schema versions
- **Warning Detection** - Optional warning checks for best practices
- **Responsive Design** - Mobile-friendly interface
- **Real-time Results** - Instant validation feedback

**Usage:**
```bash
# Serve the files locally (any web server)
npx serve examples/

# Or open directly in browser
open examples/hed-validator.html
```

### Interactive Demo (`hed-demo.html`)

A demonstration page showcasing the HED validator capabilities:

- **Pre-built Examples** - Click-to-test validation scenarios
- **Integration Guide** - Complete documentation for developers
- **API Examples** - Code snippets showing client usage
- **Quick Validator** - Embedded validation form

### Browser Client (`hed-validator-client.js`)

Modern JavaScript client with these features:

- **Dual Mode Operation** - Works with HED server or mock validation
- **Promise-based API** - Modern async/await support
- **Event System** - Status updates and notifications
- **Utility Functions** - Result formatting and form creation
- **Error Handling** - Comprehensive error management
- **TypeScript Ready** - Clean API suitable for TypeScript projects

**Basic Usage:**
```javascript
// Create validator client
const validator = new HEDValidatorClient();

// Validate HED string
const result = await validator.validateString('Event/Sensory-event, Red');

// Check results
if (result.isValid) {
    console.log('✅ Valid HED string!');
} else {
    console.log('❌ Validation errors:', result.errors);
}
```

---

## 🔌 MCP Integration Examples

The HED MCP server provides 4 tools through the Model Context Protocol:

### Available Tools
1. **validateHedString** - Validate individual HED strings with syntax checking
2. **validateHedSidecar** - Validate BIDS sidecar JSON files with HED annotations  
3. **validateHedTsv** - Validate TSV files with associated sidecar data
4. **getFileFromPath** - Read file content from the local filesystem

### Interactive MCP Client (`mcp-client.js`)

Demonstrates the full MCP protocol workflow:

- **Server Connection** - Connect to HED MCP server via stdio
- **Tool Discovery** - List available validation tools  
- **Resource Access** - Access HED schema resources
- **Validation Testing** - Test all 3 validation tools plus file access
- **Error Scenarios** - Handle validation failures gracefully

**Usage:**
```bash
# Run the interactive client
node examples/mcp-client.js

# Expected output:
# 🧠 HED MCP Client Demo
# 📡 Connecting to MCP server...
# ✅ Connected to server successfully!
# ✅ Found 4 available tools:
#   - validateHedString: Validate HED string
#   - validateHedSidecar: Validate HED sidecar  
#   - validateHedTsv: Validate HED TSV
#   - getFileFromPath: Get file content from path
# ...
```

### Automated Server Testing (`test-server.js`)

Comprehensive server testing script:

- **Automated Testing** - Run validation tests programmatically
- **Multiple Scenarios** - Test valid/invalid/warning cases
- **Performance Testing** - Measure validation speed
- **CI/CD Ready** - Suitable for continuous integration

**Usage:**
```bash
# Run automated tests
node examples/test-server.js

# For continuous testing
npm test -- --examples
```

---

## 💻 Development Examples

### Definition Processing (`definition-usage.ts`)

TypeScript example showing HED definition utilities:

- **Definition Conversion** - Convert between HED definition formats
- **Definition Management** - Create and manage definition collections  
- **Type Safety** - Full TypeScript type definitions
- **Error Handling** - Proper error management

**Usage:**
```bash
# Compile and run
npm run build
node dist/examples/definition-usage.js

# Or run directly with ts-node
npx ts-node examples/definition-usage.ts
```

---

## 🚀 Getting Started

### 1. Basic Browser Setup

For simple browser-based validation:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My HED Validator</title>
    <link rel="stylesheet" href="hed-validator.css">
</head>
<body>
    <div id="validator-container"></div>
    
    <script src="hed-validator-client.js"></script>
    <script>
        // Create validation form
        HEDValidatorClient.createValidationForm('validator-container');
    </script>
</body>
</html>
```

### 2. Server-Enabled Setup

For full validation with the HED HTTP server:

```bash
# 1. Build the project
npm run build

# 2. Start the HED HTTP server
node dist/examples/http-server.js

# 3. Serve the browser files
npx serve examples/

# 4. Open http://localhost:3000/hed-validator.html
```

### 3. MCP Integration

For MCP protocol integration:

```javascript
import { HEDMCPClient } from './mcp-client.js';

const client = new HEDMCPClient();
await client.connect();

const result = await client.validateHedString('Event/Sensory-event');
console.log(result);
```

---

## 🎯 Use Cases

### Research Applications
- **Experiment Design** - Validate HED annotations during experiment setup
- **Data Collection** - Real-time validation during data acquisition
- **Data Processing** - Batch validation of collected datasets
- **Quality Control** - Ensure annotation consistency across studies

### Development Integration  
- **Web Applications** - Embed validation in neuroscience web tools
- **Data Pipelines** - Automated validation in processing workflows
- **Quality Assurance** - Pre-publication validation checks
- **Educational Tools** - Teaching HED annotation standards

### Standalone Tools
- **Validation Service** - Deploy as microservice for validation
- **Batch Processing** - Command-line validation of multiple files
- **Interactive Debugging** - Real-time validation during annotation
- **Format Conversion** - Validate during data format conversions

---

## 📋 Requirements

### Browser Examples
- Modern web browser with ES2017+ support
- Optional: Web server for serving files (any HTTP server)
- Optional: HED HTTP server for full validation

### Node.js Examples  
- Node.js 18+ 
- All dependencies installed (`npm install`)
- Built project files (`npm run build`)

### Development Examples
- TypeScript 5.8+
- All dev dependencies installed (`npm install`)

---

## 🔧 Configuration

### Client Configuration

```javascript
const validator = new HEDValidatorClient({
    serverEndpoint: '/api/hed',  // Custom API endpoint
    timeout: 10000,              // Request timeout in ms
    retries: 3,                  // Number of retry attempts
    fallbackToMock: true         // Use mock if server fails
});
```

### Server Configuration

The browser examples work with the HED HTTP server configured in `examples/http-server.ts`:

```typescript
// Server runs on http://localhost:3000 by default
// API endpoints available:
//   POST /api/file                - Get file content from path
//   POST /api/validate/string     - Validate HED string  
//   POST /api/validate/tsv        - Validate TSV file data
//   POST /api/validate/sidecar    - Validate sidecar JSON data
// Health check: GET /health
// API info: GET /api
```

---

## 🐛 Troubleshooting

### Common Issues

1. **"Server not available" message**
   - Ensure HTTP server is running: `node dist/examples/http-server.js`
   - Check server endpoint configuration
   - Verify CORS settings for cross-origin requests

2. **Validation always shows mock results**
   - Check browser console for connection errors
   - Verify server is accessible at configured endpoint
   - Ensure server is built: `npm run build`

3. **TypeScript compilation errors**
   - Update TypeScript: `npm install -D typescript@latest`
   - Check tsconfig.json configuration
   - Verify all dependencies are installed

4. **MCP client connection issues**
   - Ensure server is built: `npm run build`
   - Check Node.js version (18+ required)
   - Verify MCP server script path in examples

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('hed-debug', 'true');

// Or in client code
const validator = new HEDValidatorClient({ debug: true });
```

---

## 📚 Additional Resources

- **[HED homepage](https://www.hedtags.org/)**
- **[MCP Protocol specification](https://modelcontextprotocol.io/)** 
- **[BIDS (Brain Imaging Data Structure standard)](https://bids.neuroimaging.io/)
- **[Project README](../README.md)**

For questions and support, please refer to the main project documentation or create an issue in the repository.
