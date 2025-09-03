#!/usr/bin/env node

/**
 * HED MCP Interactive Client Example
 * 
 * This is a comprehensive example of how to interact with the HED MCP server using
 * the Model Context Protocol (MCP). It demonstrates the full MCP communication flow
 * including initialization, tool discovery, resource listing, and validation calls.
 * 
 * DESCRIPTION:
 *   An interactive test client that connects to the HED MCP server and demonstrates
 *   all available functionality through automated testing scenarios. Perfect for
 *   understanding how to integrate the HED server into your own applications.
 * 
 * PREREQUISITES:
 *   1. Build the server first: `npm run build`
 *   2. Ensure Node.js 18+ is installed
 *   3. All dependencies installed: `npm install`
 * 
 * USAGE:
 *   node examples/mcp-client.js
 * 
 * WHAT IT DEMONSTRATES:
 *   - MCP protocol initialization and handshake
 *   - Server capability negotiation
 *   - Tool discovery and listing
 *   - Resource discovery and listing
 *   - HED string validation examples
 *   - Error handling and response parsing
 *   - Proper MCP message formatting
 *   - Clean shutdown procedures
 * 
 * OUTPUT:
 *   The client will show real-time communication with the server including:
 *   - All MCP messages sent and received
 *   - Server initialization status
 *   - Available tools and their schemas
 *   - Available resources
 *   - Validation results with errors/warnings
 *   - Clean shutdown confirmation
 * 
 * INTEGRATION EXAMPLE:
 *   This script serves as a template for building your own MCP clients.
 *   You can adapt the message sending patterns and response handling
 *   for your specific use case.
 * 
 * @author HED MCP Team
 * @license ISC
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== HED MCP Interactive Client Example ===');
console.log('This demonstrates full MCP protocol communication with the HED server.\n');

// Configuration
const SERVER_PATH = path.join(__dirname, '..', 'dist', 'src', 'server.js');
const TEST_TIMEOUT = 15000; // 15 seconds total test time

console.log(`🚀 Starting HED MCP Server: ${SERVER_PATH}`);

// Start the server with proper path handling
const server = spawn('node', [SERVER_PATH], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '..')
});

let messageId = 1;
let testPhase = 'initializing';
let toolsAvailable = [];
let resourcesAvailable = [];

// Enhanced server response handler
server.stdout.on('data', (data) => {
  const responses = data.toString().trim().split('\n');
  
  responses.forEach(response => {
    if (response.trim()) {
      try {
        const parsed = JSON.parse(response);
        console.log('\n📥 Server Response:');
        console.log(JSON.stringify(parsed, null, 2));
        
        // Handle specific response types
        handleServerResponse(parsed);
        
      } catch (e) {
        console.log('\n📥 Server Output (non-JSON):', response);
      }
    }
  });
});

// Enhanced error handling
server.stderr.on('data', (data) => {
  const logMsg = data.toString().trim();
  if (logMsg.includes('HED Schema cache initialized')) {
    console.log('\n✅ Server: Schema cache initialized');
  } else if (logMsg.includes('HED MCP Server running')) {
    console.log('✅ Server: MCP server ready');
  } else {
    console.log('\n🔧 Server Debug:', logMsg);
  }
});

// Handle server process events
server.on('close', (code) => {
  console.log(`\n🏁 Server exited with code: ${code}`);
  if (testPhase === 'completed') {
    console.log('✅ All tests completed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Server closed unexpectedly during:', testPhase);
    process.exit(1);
  }
});

server.on('error', (err) => {
  console.error('\n❌ Server error:', err.message);
  process.exit(1);
});

// Enhanced message sending with better logging
function sendMessage(message, description) {
  console.log(`\n📤 ${description}:`);
  console.log(JSON.stringify(message, null, 2));
  server.stdin.write(JSON.stringify(message) + '\n');
}

// Response handler for different message types
function handleServerResponse(response) {
  if (response.error) {
    console.log(`\n❌ Error received: ${response.error.message}`);
    return;
  }
  
  // Handle initialization response
  if (response.id === 1 && response.result) {
    console.log('\n✅ Server initialized successfully!');
    console.log(`   Protocol Version: ${response.result.protocolVersion}`);
    console.log(`   Server: ${response.result.serverInfo.name} v${response.result.serverInfo.version}`);
    testPhase = 'initialized';
  }
  
  // Handle tools list response
  if (response.id === 2 && response.result?.tools) {
    toolsAvailable = response.result.tools;
    console.log(`\n✅ Found ${toolsAvailable.length} available tools:`);
    toolsAvailable.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    testPhase = 'tools_listed';
  }
  
  // Handle resources list response
  if (response.id === 3 && response.result?.resources) {
    resourcesAvailable = response.result.resources;
    console.log(`\n✅ Found ${resourcesAvailable.length} available resources:`);
    resourcesAvailable.forEach(resource => {
      console.log(`   - ${resource.name}: ${resource.description}`);
    });
    testPhase = 'resources_listed';
  }
  
  // Handle validation test responses
  if (response.id >= 4 && response.result?.content) {
    const testNumber = response.id - 3;
    try {
      const content = JSON.parse(response.result.content[0].text);
      console.log(`\n✅ Validation Test ${testNumber} Results:`);
      console.log(`   Errors: ${content.errors?.length || 0}`);
      console.log(`   Warnings: ${content.warnings?.length || 0}`);
      
      if (content.errors?.length > 0) {
        console.log('   Error Details:');
        content.errors.forEach((error, i) => {
          console.log(`     ${i + 1}. ${error.message}`);
        });
      }
      
      if (content.warnings?.length > 0) {
        console.log('   Warning Details:');
        content.warnings.forEach((warning, i) => {
          console.log(`     ${i + 1}. ${warning.message}`);
        });
      }
      
    } catch (e) {
      console.log('\n❌ Failed to parse validation result');
    }
  }
}

// === Test Execution Sequence ===

// Phase 1: Initialize the server
setTimeout(() => {
  testPhase = 'initializing';
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      clientInfo: {
        name: 'hed-mcp-interactive-client',
        version: '1.0.0'
      }
    }
  }, 'Server Initialization');
}, 1000);

// Phase 2: List available tools
setTimeout(() => {
  testPhase = 'listing_tools';
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/list',
    params: {}
  }, 'Tools Discovery');
}, 2000);

// Phase 3: List available resources
setTimeout(() => {
  testPhase = 'listing_resources';
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'resources/list',
    params: {}
  }, 'Resources Discovery');
}, 3000);

// Phase 4: Test validateHedString with valid string
setTimeout(() => {
  testPhase = 'testing_validation';
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'validateHedString',
      arguments: {
        hedString: 'Event/Sensory-event, Red, Blue',
        hedVersion: '8.4.0',
        checkForWarnings: true
      }
    }
  }, 'HED Validation Test 1 (Valid String)');
}, 4000);

// Phase 5: Test validateHedString with invalid string
setTimeout(() => {
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'validateHedString',
      arguments: {
        hedString: 'InvalidTag, AnotherBadTag',
        hedVersion: '8.4.0',
        checkForWarnings: true
      }
    }
  }, 'HED Validation Test 2 (Invalid String)');
}, 5000);

// Phase 6: Test validateHedString with definitions
setTimeout(() => {
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'validateHedString',
      arguments: {
        hedString: 'Def/MyStimulus, Blue',
        hedVersion: '8.4.0',
        checkForWarnings: true,
        definitions: [
          '(Definition/MyStimulus, (Event/Sensory-event, (Red, Circle)))'
        ]
      }
    }
  }, 'HED Validation Test 3 (With Definitions)');
}, 6000);

// Phase 7: Test getFileFromPath (if available)
setTimeout(() => {
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'getFileFromPath',
      arguments: {
        filePath: path.join(__dirname, '..', 'package.json')
      }
    }
  }, 'File Access Test (package.json)');
}, 7000);

// Final Phase: Graceful shutdown
setTimeout(() => {
  testPhase = 'completed';
  console.log('\n� All test scenarios completed!');
  console.log('\n📊 Test Summary:');
  console.log(`   - Tools Available: ${toolsAvailable.length}`);
  console.log(`   - Resources Available: ${resourcesAvailable.length}`);
  console.log('   - Validation Tests: 3 scenarios executed');
  console.log('   - File Access Test: 1 scenario executed');
  
  console.log('\n🏁 Shutting down server gracefully...');
  server.kill('SIGTERM');
  
  // Fallback exit
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}, TEST_TIMEOUT - 2000);

// Emergency timeout
setTimeout(() => {
  console.log('\n⏰ Test timeout reached. Forcing shutdown...');
  server.kill('SIGKILL');
  process.exit(1);
}, TEST_TIMEOUT);

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('\n⚠️ Received SIGINT. Shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Received SIGTERM. Shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});

console.log('\n⏱️  Test sequence will run for up to 15 seconds...');
console.log('📋 Watch for real-time MCP communication below:\n');
