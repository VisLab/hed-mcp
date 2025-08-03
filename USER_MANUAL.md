# HED MCP Server User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding HED](#understanding-hed)
4. [Server Architecture](#server-architecture)
5. [Tool Reference](#tool-reference)
6. [Working with HED Data](#working-with-hed-data)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [Performance Optimization](#performance-optimization)
10. [Integration Guide](#integration-guide)

## Introduction

The HED MCP (Model Context Protocol) Server provides a standardized interface for validating HED (Hierarchical Event Descriptor) data. HED is a system for describing events in neuroimaging and behavioral experiments using a controlled vocabulary organized in a hierarchical structure.

### What is HED?

HED (Hierarchical Event Descriptor) is:
- A standardized vocabulary for describing experimental events
- A hierarchical system that allows for precise event annotation
- Widely used in BIDS (Brain Imaging Data Structure) datasets
- Essential for reproducible neuroscience research

### What is MCP?

Model Context Protocol (MCP) is:
- A standardized protocol for tool and resource sharing
- Enables AI assistants and applications to access external capabilities
- Provides a consistent interface across different implementations
- Facilitates integration between diverse software systems

## Getting Started

### Prerequisites

Before using the HED MCP Server, ensure you have:

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **Basic understanding of HED**: Familiarity with HED concepts is helpful
3. **MCP-compatible client**: Such as the MCP Inspector or custom client

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd hed-mcp-typescript
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the server**:
   ```bash
   npm run build
   ```

4. **Test the installation**:
   ```bash
   npx @modelcontextprotocol/inspector node dist/server.js
   ```

### First Steps

1. **Open the MCP Inspector** in your browser
2. **Initialize the server** - this happens automatically
3. **List available tools** to see what's available
4. **Try a simple validation** with `validateHedString`

## Understanding HED

### HED Basics

HED uses a hierarchical tag structure where tags are organized from general to specific:

```
Event/Sensory-event          # General event type
Event/Sensory-event/Visual   # More specific
Property/Sensory-property/Color/Red  # Very specific
```

### Tag Structure

- **Path notation**: Tags use forward slashes to indicate hierarchy
- **Grouping**: Parentheses group related tags: `(Red, Large)`
- **Definitions**: Custom definitions for complex concepts
- **Extension**: Adding custom subtags to existing hierarchy

### Common HED Patterns

#### Basic Event Description
```
Event/Sensory-event, Property/Sensory-property/Visual/Color/Red
```

#### Grouped Tags
```
(Event/Sensory-event, (Property/Sensory-property/Visual/Color/Red, Property/Physical-property/Size/Large))
```

#### Using Definitions
```
Def/StimulusOnset, Property/Sensory-property/Visual/Color/Blue
```

### Schema Versions

HED schemas evolve over time. Common versions include:

- **Standard HED**: `8.3.0`, `8.4.0`, `8.5.0`
- **Library schemas**: 
  - `lang_1.1.0` - Language-related tags
  - `score_2.1.0` - Scoring and measurement tags
  - `testlib_2.0.0` - Test library for development

## Server Architecture

### Core Components

```
HED MCP Server
├── Tools (Validation Functions)
│   ├── validateHedString
│   ├── validateHedTsv  
│   └── parseHedSidecar
├── Resources (Schema Information)
│   └── hedSchemaResource
├── Utilities
│   ├── Schema Cache
│   ├── Definition Processor
│   ├── File Reader
│   └── Issue Formatter
└── Type System
    ├── FormattedIssue
    ├── HedValidationResult
    └── ParseHedSidecarResult
```

### Data Flow

1. **Client Request** → MCP Server
2. **Schema Loading** → Cache or Load from Network
3. **Data Processing** → Parse and Validate
4. **Issue Formatting** → Standardize Error/Warning Format
5. **Response** → Return to Client

### Caching System

The server implements intelligent caching:

- **Schema caching**: Avoids reloading schemas for repeated operations
- **Definition caching**: Reuses processed definitions
- **Memory management**: Automatic cleanup of unused cache entries

## Tool Reference

### validateHedString

**Purpose**: Validates individual HED tag strings

**When to use**:
- Testing specific HED constructs
- Interactive validation during annotation
- Validating programmatically generated HED strings

**Parameters**:
- `hedString` (required): The HED string to validate
- `hedVersion` (required): Schema version (e.g., "8.4.0")
- `checkForWarnings` (optional): Include warnings in results
- `definitions` (optional): Array of definition strings

**Best practices**:
- Use specific schema versions in production
- Enable warnings during development
- Group related definitions together

### validateHedTsv

**Purpose**: Validates TSV files containing HED annotations

**When to use**:
- Validating BIDS event files
- Checking TSV files before publication
- Automated dataset validation

**Parameters**:
- `filePath` (required): Path to TSV file
- `hedVersion` (required): Schema version
- `checkForWarnings` (optional): Include warnings
- `fileData` (optional): Inline TSV data
- `jsonData` (optional): Sidecar data as JSON string
- `definitions` (optional): Definition strings

**Best practices**:
- Use `fileData` for small datasets to avoid file I/O
- Include sidecar data via `jsonData` for complete validation
- Process files in batches for large datasets

### parseHedSidecar

**Purpose**: Parses and validates HED sidecar JSON files

**When to use**:
- Validating BIDS sidecar files
- Checking JSON structure and HED content
- Converting between sidecar formats

**Parameters**:
- `filePath` (required): Path to JSON sidecar file
- `hedVersion` (required): Schema version
- `checkForWarnings` (optional): Include warnings
- `fileData` (optional): Inline JSON data

**Best practices**:
- Validate sidecar files before TSV files
- Use parsed output for debugging sidecar structure
- Check both structure and HED content validity

## Working with HED Data

### Validation Workflow

1. **Schema Selection**: Choose appropriate HED schema version
2. **Definition Setup**: Prepare any custom definitions
3. **Data Validation**: Run appropriate validation tool
4. **Issue Resolution**: Address errors and warnings
5. **Quality Assurance**: Final validation with warnings enabled

### Common Validation Scenarios

#### Scenario 1: New Dataset Validation

```json
// 1. First validate sidecar files
{
  "name": "parseHedSidecar",
  "arguments": {
    "filePath": "/data/task-rest_events.json",
    "hedVersion": "8.4.0",
    "checkForWarnings": true
  }
}

// 2. Then validate TSV files with sidecar data
{
  "name": "validateHedTsv", 
  "arguments": {
    "filePath": "/data/sub-01_task-rest_events.tsv",
    "hedVersion": "8.4.0",
    "jsonData": "{...sidecar content...}",
    "checkForWarnings": true
  }
}
```

#### Scenario 2: Interactive Annotation

```json
// Test individual HED strings during annotation
{
  "name": "validateHedString",
  "arguments": {
    "hedString": "Event/Sensory-event, (Red, Large)",
    "hedVersion": "8.4.0",
    "checkForWarnings": true
  }
}
```

#### Scenario 3: Definition Development

```json
// Test definitions before using in datasets
{
  "name": "validateHedString",
  "arguments": {
    "hedString": "Def/MyStimulus, Blue",
    "hedVersion": "8.4.0", 
    "definitions": [
      "(Definition/MyStimulus, (Event/Sensory-event, (Onset)))"
    ],
    "checkForWarnings": true
  }
}
```

### Error Interpretation

#### Common Error Types

1. **TAG_INVALID**: Tag not found in schema
   - Check spelling and capitalization
   - Verify tag exists in specified schema version
   - Consider using extension tags if appropriate

2. **DEFINITION_INVALID**: Malformed definition
   - Ensure proper parentheses around definition content
   - Check that definition name follows conventions
   - Verify definition content is valid HED

3. **SCHEMA_LOAD_FAILED**: Invalid schema version
   - Verify schema version exists
   - Check network connectivity for schema download
   - Use stable, released schema versions

4. **FILE_READ_ERROR**: Cannot read specified file
   - Verify file path and permissions
   - Check file exists and is readable
   - Consider using inline data for virtual files

#### Warning Types

1. **TAG_EXTENDED**: Extension tag used
   - Consider using more specific standard tags
   - Acceptable for novel experimental paradigms
   - Document extensions for reproducibility

2. **DEFINITION_WARNING**: Definition issues
   - Non-critical definition problems
   - May indicate style or convention issues
   - Review definition structure and content

### Data Quality Guidelines

#### High-Quality HED Annotations

1. **Specificity**: Use most specific appropriate tags
2. **Consistency**: Apply same annotation patterns throughout dataset
3. **Completeness**: Annotate all relevant aspects of events
4. **Accuracy**: Ensure annotations match actual experimental events

#### Quality Checklist

- [ ] All files validate without errors
- [ ] Warnings reviewed and addressed where appropriate
- [ ] Definitions properly documented
- [ ] Schema version appropriate for dataset
- [ ] Annotations consistent across similar events

## Advanced Features

### Multi-Schema Validation

Combine multiple schemas for specialized vocabularies:

```json
{
  "hedVersion": "8.4.0, lang_1.1.0, score_2.1.0"
}
```

**Use cases**:
- Language experiments (standard + language schema)
- Scoring paradigms (standard + score schema)
- Complex experiments requiring multiple vocabularies

### Definition Management

#### Definition Best Practices

1. **Naming**: Use descriptive, unique names
2. **Structure**: Keep definitions simple and focused
3. **Reusability**: Design for reuse across similar experiments
4. **Documentation**: Document purpose and usage

#### Definition Examples

```javascript
// Simple stimulus definition
"(Definition/RedCircle, (Event/Sensory-event, (Red, Circle)))"

// Complex behavioral definition  
"(Definition/CorrectResponse, (Action/Move, Agent/Human, (Correct-action, (Voluntary))))"

// Hierarchical definitions
"(Definition/VisualStimulus, (Event/Sensory-event, Property/Sensory-property/Visual))"
"(Definition/RedVisualStimulus, (Def/VisualStimulus, Red))"
```

### Batch Processing

For large datasets, implement batch processing:

```javascript
async function validateDataset(files, hedVersion, definitions) {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await mcpClient.call('tools/call', {
        name: 'validateHedTsv',
        arguments: {
          filePath: file,
          hedVersion,
          definitions,
          checkForWarnings: false
        }
      });
      
      results.push({
        file,
        success: JSON.parse(result.content[0].text).errors.length === 0
      });
    } catch (error) {
      results.push({ file, success: false, error: error.message });
    }
  }
  
  return results;
}
```

## Troubleshooting

### Common Issues

#### Issue: Server Won't Start

**Symptoms**: Server exits immediately or shows connection errors

**Solutions**:
1. Check Node.js version (requires 18+)
2. Verify build completed successfully: `npm run build`
3. Check for port conflicts
4. Review error messages in console

#### Issue: Schema Loading Failures

**Symptoms**: `SCHEMA_LOAD_FAILED` errors

**Solutions**:
1. Verify internet connectivity for schema downloads
2. Use exact schema version strings
3. Check schema cache directory permissions
4. Try clearing cache: delete node_modules and reinstall

#### Issue: File Reading Errors

**Symptoms**: `FILE_READ_ERROR` when accessing files

**Solutions**:
1. Verify file paths are absolute
2. Check file permissions and existence
3. Use inline data (`fileData`) for testing
4. Ensure proper file encoding (UTF-8)

#### Issue: Validation Inconsistencies

**Symptoms**: Different results from same input

**Solutions**:
1. Ensure consistent schema versions
2. Clear schema cache if needed
3. Check for concurrent validation conflicts
4. Verify definition ordering and consistency

### Debug Mode

Enable debug logging:

```bash
DEBUG=* node dist/server.js
```

Or in MCP client configuration:

```json
{
  "servers": {
    "hed-mcp": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "DEBUG": "*"
      }
    }
  }
}
```

### Performance Issues

#### Memory Usage

- Monitor memory usage with large datasets
- Process files in batches if memory constrained
- Clear unused schema cache entries
- Use streaming for very large files

#### Speed Optimization

- Reuse server connections for multiple operations
- Cache schemas and definitions between operations
- Use inline data to avoid file I/O overhead
- Disable warnings for production validation

## Performance Optimization

### Schema Caching

The server automatically caches loaded schemas to improve performance:

```typescript
// Schemas are cached by version string
const schema1 = await schemaCache.getOrCreateSchema('8.4.0');
const schema2 = await schemaCache.getOrCreateSchema('8.4.0'); // Uses cache
```

### Definition Reuse

Process definitions once and reuse:

```javascript
// Define once, use multiple times
const definitions = [
  "(Definition/Fixation, (Event/Sensory-event, (Onset)))",
  "(Definition/Response, (Action/Move, Agent/Human))"
];

// Use in multiple validations
for (const hedString of hedStrings) {
  const result = await validate({
    hedString,
    hedVersion: '8.4.0',
    definitions  // Reuse same definitions
  });
}
```

### Batch Operations

```javascript
// Efficient batch processing
const server = new MCPServer();
await server.connect();

try {
  const results = await Promise.all(
    files.map(file => 
      server.call('validateHedTsv', {
        filePath: file,
        hedVersion: '8.4.0'
      })
    )
  );
} finally {
  await server.disconnect();
}
```

## Integration Guide

### MCP Client Integration

#### Basic Client Setup

```javascript
import { MCPClient } from '@modelcontextprotocol/client';

const client = new MCPClient({
  server: {
    command: 'node',
    args: ['dist/server.js'],
    cwd: '/path/to/hed-mcp-typescript'
  }
});

await client.connect();
```

#### Error Handling

```javascript
async function safeValidation(hedString, hedVersion) {
  try {
    const response = await client.call('tools/call', {
      name: 'validateHedString',
      arguments: { hedString, hedVersion }
    });
    
    const result = JSON.parse(response.content[0].text);
    
    return {
      success: result.errors.length === 0,
      errors: result.errors,
      warnings: result.warnings
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ 
        code: 'CLIENT_ERROR',
        message: error.message,
        severity: 'error'
      }],
      warnings: []
    };
  }
}
```

### Web Application Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>HED Validator</title>
</head>
<body>
    <textarea id="hedInput" placeholder="Enter HED string..."></textarea>
    <button onclick="validateHED()">Validate</button>
    <div id="results"></div>

    <script>
        async function validateHED() {
            const hedString = document.getElementById('hedInput').value;
            
            try {
                const response = await fetch('/api/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hedString,
                        hedVersion: '8.4.0',
                        checkForWarnings: true
                    })
                });
                
                const result = await response.json();
                displayResults(result);
            } catch (error) {
                console.error('Validation failed:', error);
            }
        }
        
        function displayResults(result) {
            const resultsDiv = document.getElementById('results');
            
            if (result.errors.length === 0) {
                resultsDiv.innerHTML = '<p style="color: green;">✅ Valid HED string!</p>';
            } else {
                resultsDiv.innerHTML = '<p style="color: red;">❌ Validation errors:</p>';
                result.errors.forEach(error => {
                    resultsDiv.innerHTML += `<p>• ${error.message}</p>`;
                });
            }
            
            if (result.warnings.length > 0) {
                resultsDiv.innerHTML += '<p style="color: orange;">⚠️ Warnings:</p>';
                result.warnings.forEach(warning => {
                    resultsDiv.innerHTML += `<p>• ${warning.message}</p>`;
                });
            }
        }
    </script>
</body>
</html>
```

### Command Line Integration

```bash
#!/bin/bash
# validate-dataset.sh - Validate all HED files in a BIDS dataset

DATASET_DIR="$1"
HED_VERSION="8.4.0"

echo "Validating BIDS dataset: $DATASET_DIR"

# Validate sidecar files
find "$DATASET_DIR" -name "*_events.json" | while read file; do
    echo "Validating sidecar: $file"
    # Call parseHedSidecar via MCP client
    validate_sidecar "$file" "$HED_VERSION"
done

# Validate TSV files  
find "$DATASET_DIR" -name "*_events.tsv" | while read file; do
    echo "Validating TSV: $file"
    # Call validateHedTsv via MCP client
    validate_tsv "$file" "$HED_VERSION"
done

echo "Dataset validation complete!"
```

### Python Integration

```python
import asyncio
import json
from mcp_client import MCPClient

class HEDValidator:
    def __init__(self, server_path):
        self.client = MCPClient(server_path)
    
    async def __aenter__(self):
        await self.client.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.disconnect()
    
    async def validate_string(self, hed_string, hed_version="8.4.0", check_warnings=True):
        """Validate a HED string."""
        response = await self.client.call('tools/call', {
            'name': 'validateHedString',
            'arguments': {
                'hedString': hed_string,
                'hedVersion': hed_version,
                'checkForWarnings': check_warnings
            }
        })
        
        return json.loads(response['content'][0]['text'])
    
    async def validate_file(self, file_path, hed_version="8.4.0", definitions=None):
        """Validate a TSV file."""
        args = {
            'filePath': file_path,
            'hedVersion': hed_version,
            'checkForWarnings': True
        }
        
        if definitions:
            args['definitions'] = definitions
        
        response = await self.client.call('tools/call', {
            'name': 'validateHedTsv',
            'arguments': args
        })
        
        return json.loads(response['content'][0]['text'])

# Usage example
async def main():
    async with HEDValidator('/path/to/hed-mcp-typescript/dist/server.js') as validator:
        # Validate a HED string
        result = await validator.validate_string(
            "Event/Sensory-event, Red, Blue",
            hed_version="8.4.0"
        )
        
        if result['errors']:
            print("Validation errors found:")
            for error in result['errors']:
                print(f"  - {error['message']}")
        else:
            print("HED string is valid!")
        
        # Validate a file
        file_result = await validator.validate_file(
            "/data/sub-01_task-rest_events.tsv",
            hed_version="8.4.0"
        )
        
        print(f"File validation: {len(file_result['errors'])} errors, {len(file_result['warnings'])} warnings")

if __name__ == "__main__":
    asyncio.run(main())
```

This user manual provides comprehensive guidance for using the HED MCP Server effectively. It covers everything from basic concepts to advanced integration scenarios, helping users validate HED data efficiently and correctly.
