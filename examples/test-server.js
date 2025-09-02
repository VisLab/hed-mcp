#!/usr/bin/env node

/**
 * HED MCP Server Test Client
 * 
 * This script demonstrates how to interact //Handle server // Handle server exit
server.on('close', (code) => {
  // Test completed successfully if we get here
  process.exit(0);
});r.on('close', (code) => {
  console.log(`\n🏁 Server exited with code ${code}`);
  
  if (code === 0 || code === null) {
    console.log('✅ Test completed successfully!');
  } else {
    console.log('❌ Test failed - server exited with error');
    process.exit(1);
  }
});D MCP server programmatically.
 * It tests the basic MCP protocol communication including initialization, 
 * tool discovery, and sample validation calls.
 * 
 * Usage:
 *   node examples/test-server.js
 * 
 * Prerequisites:
 *   - Run `npm run build` first to compile the TypeScript server
 *   - Ensure the server is properly configured
 * 
 * @author HED MCP Team
 * @license ISC
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== HED MCP Server Test Client ===\n');

// Test the MCP server - note the server is now in dist/src/
const serverPath = path.join(__dirname, '..', 'dist', 'src', 'server.js');
console.log(`Starting server: ${serverPath}`);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '..')
});

let responseCount = 0;
let initComplete = false;

// Handle server responses
server.stdout.on('data', (data) => {
  const responses = data.toString().split('\n').filter(line => line.trim());
  
  responses.forEach(response => {
    if (response.trim()) {
      try {
        const parsed = JSON.parse(response);
        responseCount++;
        
        console.log(`📨 Response ${responseCount}:`);
        console.log(JSON.stringify(parsed, null, 2));
        console.log();
        
        // Handle initialization response
        if (parsed.id === 1 && parsed.result) {
          initComplete = true;
          console.log('✅ Server initialized successfully!');
          
          // Request available tools
          setTimeout(() => {
            sendToolsListRequest();
          }, 100);
        }
        
        // Handle tools list response
        if (parsed.id === 2 && parsed.result?.tools) {
          console.log(`✅ Found ${parsed.result.tools.length} available tools:`);
          parsed.result.tools.forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description}`);
          });
          console.log();
          
          // Test a validation call
          setTimeout(() => {
            sendValidationTest();
          }, 100);
        }
        
        // Handle validation test response
        if (parsed.id === 3) {
          if (parsed.result) {
            console.log('✅ Validation test completed successfully!');
            const content = JSON.parse(parsed.result.content[0].text);
            console.log(`   Errors: ${content.errors?.length || 0}`);
            console.log(`   Warnings: ${content.warnings?.length || 0}`);
            
            console.log('\n🎯 All tests completed successfully! ✅');
          } else if (parsed.error) {
            console.log('❌ Validation test failed:');
            console.log(`   ${parsed.error.message}`);
          }
          
          // Clean shutdown
          server.kill('SIGTERM');
          return; // Exit the response handler
        }
        
      } catch (error) {
        console.log('📝 Raw response:', response);
      }
    }
  });
});

// Handle server errors
server.stderr.on('data', (data) => {
  const errorMsg = data.toString();
  console.log('🔧 Server debug:', errorMsg.trim());
});

// Handle server exit
server.on('close', (code) => {
  console.log(`\n🏁 Server exited with code ${code}`);
  
  if (code === 0) {
    console.log('✅ Test completed successfully!');
  } else {
    console.log('❌ Test failed - server exited with error');
    process.exit(1);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Received SIGINT, shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});

// Send initialization message
function sendInitMessage() {
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      clientInfo: {
        name: 'hed-mcp-test-client',
        version: '1.0.0'
      }
    }
  };
  
  console.log('📤 Sending initialization...');
  server.stdin.write(JSON.stringify(initMessage) + '\n');
}

// Request list of available tools
function sendToolsListRequest() {
  const toolsMessage = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  console.log('📤 Requesting tools list...');
  server.stdin.write(JSON.stringify(toolsMessage) + '\n');
}

// Test a validation call
function sendValidationTest() {
  const validationMessage = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'validateHedString',
      arguments: {
        hedString: 'Event/Sensory-event, Red, Blue',
        hedVersion: '8.4.0',
        checkForWarnings: true
      }
    }
  };
  
  console.log('📤 Testing HED string validation...');
  server.stdin.write(JSON.stringify(validationMessage) + '\n');
}

// Start the test
console.log('🚀 Starting MCP communication test...\n');
sendInitMessage();

// Timeout fallback
setTimeout(() => {
  if (!initComplete) {
    console.log('⏰ Timeout: Server failed to initialize within 10 seconds');
    server.kill('SIGTERM');
    process.exit(1);
  }
}, 10000);
