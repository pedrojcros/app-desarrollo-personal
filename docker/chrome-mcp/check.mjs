import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';

const configuration = JSON.parse(await readFile('.mcp.json', 'utf8'));
const server = configuration.mcpServers['chrome-devtools'];
const processHandle = spawn(server.command, server.args, {
  stdio: ['pipe', 'pipe', 'inherit'],
});
const responses = createInterface({ input: processHandle.stdout });
const pendingRequests = new Map();
let nextRequestId = 0;

processHandle.on('exit', (exitCode) => {
  for (const pendingRequest of pendingRequests.values()) {
    clearTimeout(pendingRequest.timeout);
    pendingRequest.reject(new Error(`MCP process exited: ${exitCode}`));
  }
  pendingRequests.clear();
});

responses.on('line', (line) => {
  const response = JSON.parse(line);
  const pendingRequest = pendingRequests.get(response.id);
  if (!pendingRequest) {
    return;
  }
  clearTimeout(pendingRequest.timeout);
  pendingRequests.delete(response.id);
  if (response.error) {
    pendingRequest.reject(new Error(JSON.stringify(response.error)));
    return;
  }
  pendingRequest.resolve(response.result);
});

function sendMessage(message) {
  processHandle.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(method, parameters) {
  nextRequestId += 1;
  const requestId = nextRequestId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`MCP request timed out: ${method}`));
    }, 180000);
    pendingRequests.set(requestId, { resolve, reject, timeout });
    sendMessage({ jsonrpc: '2.0', id: requestId, method, params: parameters });
  });
}

async function callTool(name, argumentsValue) {
  const result = await request('tools/call', {
    name,
    arguments: argumentsValue,
  });
  if (result.isError) {
    throw new Error(JSON.stringify(result.content));
  }
  return result;
}

try {
  const initialization = await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'adp-browser-check', version: '1.0.0' },
  });
  console.log(
    `MCP: ${initialization.serverInfo.name} ${initialization.serverInfo.version}`,
  );
  sendMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const port = process.env.EXPO_PORT ?? '8081';
  const url = `http://localhost:${port}/hoy`;
  const page = await callTool('new_page', { url, timeout: 120000 });
  console.log(JSON.stringify(page));
  const pagesText = page.content[0].text;
  const selectedPage = pagesText.match(/^(\d+): .* \[selected\]$/m);
  if (!selectedPage) {
    throw new Error('The MCP did not return a selected page.');
  }
  const pageId = Number(selectedPage[1]);
  const snapshot = await callTool('take_snapshot', { pageId });
  console.log(JSON.stringify(snapshot));
  const snapshotText = JSON.stringify(snapshot.content);
  if (!snapshotText.includes('Hoy')) {
    throw new Error('The browser did not render the Hoy tab.');
  }
  console.log(
    `PASS: Chromium rendered Hoy at ${url} through the container MCP.`,
  );
} finally {
  for (const pendingRequest of pendingRequests.values()) {
    clearTimeout(pendingRequest.timeout);
  }
  processHandle.stdin.end();
  responses.close();
}
