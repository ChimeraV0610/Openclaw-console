const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3187;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function runOpenClaw(args) {
  return new Promise((resolve, reject) => {
    const quotedArgs = args.map(arg => /\s/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg).join(' ');
    const binary = process.platform === 'win32' ? 'openclaw' : 'openclaw';
    exec(`${binary} ${quotedArgs}`, { timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

function readTasks() {
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch {
    return { tasks: [] };
  }
}

function writeTasks(data) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

function inferAgentHealth(statusJson, sessionsJson) {
  const statusAgents = statusJson?.agents?.agents || [];
  const heartbeatAgents = new Map((statusJson?.heartbeat?.agents || []).map(item => [item.agentId, item]));
  const rawSessionGroups = statusJson?.sessions?.byAgent || sessionsJson?.byAgent || [];
  const sessionsByAgent = new Map(rawSessionGroups.map(item => [item.agentId, item]));

  if (!sessionsByAgent.size && Array.isArray(sessionsJson?.sessions)) {
    for (const session of sessionsJson.sessions) {
      const existing = sessionsByAgent.get(session.agentId) || { agentId: session.agentId, recent: [] };
      existing.recent.push(session);
      sessionsByAgent.set(session.agentId, existing);
    }
  }

  return statusAgents.map(agent => {
    const ageMs = agent.lastActiveAgeMs ?? null;
    const activeWithin10m = typeof ageMs === 'number' ? ageMs <= 10 * 60 * 1000 : false;
    const activeWithin1h = typeof ageMs === 'number' ? ageMs <= 60 * 60 * 1000 : false;
    const heartbeat = heartbeatAgents.get(agent.id);
    const sessionInfo = sessionsByAgent.get(agent.id);
    const recent = sessionInfo?.recent?.[0] || null;

    let state = 'idle';
    if (activeWithin10m) state = 'working';
    else if (activeWithin1h) state = 'online';
    else state = 'offline';

    return {
      id: agent.id,
      workspaceDir: agent.workspaceDir,
      bootstrapPending: !!agent.bootstrapPending,
      sessionsCount: agent.sessionsCount || 0,
      lastUpdatedAt: agent.lastUpdatedAt || null,
      lastActiveAgeMs: ageMs,
      heartbeatEnabled: !!heartbeat?.enabled,
      heartbeatEvery: heartbeat?.every || 'disabled',
      state,
      recentSession: recent,
      primary: agent.id === (statusJson?.agents?.defaultId || 'main')
    };
  }).sort((a, b) => Number(b.primary) - Number(a.primary) || a.id.localeCompare(b.id));
}

function summarizeTasks(tasks) {
  const all = tasks.tasks || [];
  const completed = all.filter(task => task.status === 'done').length;
  const pending = all.filter(task => task.status !== 'done').length;
  const inProgress = all.filter(task => task.status === 'in_progress').length;
  return {
    total: all.length,
    completed,
    pending,
    inProgress
  };
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function serveStatic(req, res) {
  const requested = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PUBLIC_DIR, requested.replace(/^\//, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, 'Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    }[ext] || 'application/octet-stream';
    sendText(res, 200, data, contentType);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      sendJson(res, 200, { ok: true, service: 'openclaw-agent-dashboard', time: new Date().toISOString() });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/overview') {
      const [statusRaw, sessionsRaw] = await Promise.all([
        runOpenClaw(['status', '--json']),
        runOpenClaw(['sessions', '--all-agents', '--json'])
      ]);
      const statusJson = parseJsonSafe(statusRaw);
      const sessionsJson = parseJsonSafe(sessionsRaw);
      const tasks = readTasks();
      sendJson(res, 200, {
        fetchedAt: new Date().toISOString(),
        openclaw: {
          status: statusJson,
          sessions: sessionsJson,
          agentHealth: inferAgentHealth(statusJson, sessionsJson)
        },
        tasks,
        taskSummary: summarizeTasks(tasks)
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/tasks') {
      sendJson(res, 200, readTasks());
      return;
    }

    if (req.method === 'POST' && req.url === '/api/tasks') {
      const body = await readBody(req);
      const input = parseJsonSafe(body);
      if (!input?.title) {
        sendJson(res, 400, { error: 'title is required' });
        return;
      }
      const tasks = readTasks();
      const task = {
        id: `task_${Date.now()}`,
        title: String(input.title),
        owner: input.owner ? String(input.owner) : 'gpt',
        status: input.status ? String(input.status) : 'todo',
        notes: input.notes ? String(input.notes) : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.tasks.unshift(task);
      writeTasks(tasks);
      sendJson(res, 201, task);
      return;
    }

    if (req.method === 'PATCH' && req.url.startsWith('/api/tasks/')) {
      const id = decodeURIComponent(req.url.split('/').pop());
      const body = await readBody(req);
      const input = parseJsonSafe(body) || {};
      const tasks = readTasks();
      const task = tasks.tasks.find(item => item.id === id);
      if (!task) {
        sendJson(res, 404, { error: 'task not found' });
        return;
      }
      if (input.title !== undefined) task.title = String(input.title);
      if (input.owner !== undefined) task.owner = String(input.owner);
      if (input.status !== undefined) task.status = String(input.status);
      if (input.notes !== undefined) task.notes = String(input.notes);
      task.updatedAt = new Date().toISOString();
      writeTasks(tasks);
      sendJson(res, 200, task);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`OpenClaw Agent Dashboard running at http://127.0.0.1:${PORT}`);
});
