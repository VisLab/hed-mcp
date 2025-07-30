const { spawn } = require('child_process');
const path = require('path');

// Test the MCP server
const serverPath = path.join(__dirname, 'dist', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

// Send initialization message
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
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Send the message
server.stdin.write(JSON.stringify(initMessage) + '\n');

// Wait a bit then request tools list
setTimeout(() => {
  const toolsMessage = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  server.stdin.write(JSON.stringify(toolsMessage) + '\n');
}, 1000);

// Close after 3 seconds
setTimeout(() => {
  server.kill();
}, 3000);
