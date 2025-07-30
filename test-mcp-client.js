#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('Starting MCP Test Client...');
console.log('This will connect to your HED MCP server and test it interactively.');

// Start the server
const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let messageId = 1;

// Handle server responses
server.stdout.on('data', (data) => {
  const responses = data.toString().trim().split('\n');
  responses.forEach(response => {
    if (response.trim()) {
      try {
        const parsed = JSON.parse(response);
        console.log('\n📥 Server Response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('\n📥 Server Output:', response);
      }
    }
  });
});

server.stderr.on('data', (data) => {
  console.log('\n🔧 Server Log:', data.toString().trim());
});

// Send a message to the server
function sendMessage(message) {
  console.log('\n📤 Sending:', JSON.stringify(message, null, 2));
  server.stdin.write(JSON.stringify(message) + '\n');
}

// Initialize the server
setTimeout(() => {
  console.log('\n🚀 Initializing server...');
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
        name: 'test-client',
        version: '1.0.0'
      }
    }
  });
}, 500);

// List tools
setTimeout(() => {
  console.log('\n📋 Listing available tools...');
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/list',
    params: {}
  });
}, 1500);

// List resources
setTimeout(() => {
  console.log('\n📋 Listing available resources...');
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'resources/list',
    params: {}
  });
}, 2500);

// Test the validateHedString tool
setTimeout(() => {
  console.log('\n🔧 Testing validateHedString tool...');
  sendMessage({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'validateHedString',
      arguments: {
        hedString: 'Red, Blue, (Green, Large)',
        hedVersion: '8.4.0',
        checkForWarnings: false
      }
    }
  });
}, 3500);

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('\n🏁 Test complete. Closing server...');
  server.kill();
  process.exit(0);
}, 10000);

console.log('\nMCP Test Client running. Watch for server responses...\n');
