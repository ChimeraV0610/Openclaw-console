const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3187;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const AUTOMATION_FILE = path.join(DATA_DIR, 'automation.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
}
if (!fs.existsSync(AUTOMATION_FILE)) {
  fs.writeFileSync(AUTOMATION_FILE, JSON.stringify({ enabled: true, mode: 'task-board', lastHeartbeatRunAt: null, lastNotificationAt: null }, null, 2));
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
    exec(`openclaw ${quotedArgs}`, { timeout: 20000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

function parseJsonSafe(text, fallback = null) {
  try {
    const normalized = typeof text === 'string' ? text.replace(/^\uFEFF/, '') : text;
    return JSON.parse(normalized);
  } catch {
    return fallback;
  }
}

function readTasks() {
  return parseJsonSafe(fs.readFileSync(TASKS_FILE, 'utf8'), { meta: {}, tasks: [] });
}

function writeTasks(data) {
  data.meta = { ...(data.meta || {}), updatedAt: new Date().toISOString() };
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

function readAutomation() {
  return parseJsonSafe(fs.readFileSync(AUTOMATION_FILE, 'utf8'), { enabled: true, mode: 'task-board' });
}

function writeAutomation(data) {
  fs.writeFileSync(AUTOMATION_FILE, JSON.stringify(data, null, 2));
}

async function sendDirectNotification(text) {
  const automation = readAutomation();
  const notify = automation.notify || {};
  if (!notify.channel || !notify.target) return false;
  const args = ['message', 'send', '--channel', String(notify.channel), '--target', String(notify.target), '--message', text];
  if (notify.account) args.splice(4, 0, '--account', String(notify.account));
  await runOpenClaw(args);
  automation.lastNotificationAt = new Date().toISOString();
  writeAutomation(automation);
  return true;
}

async function triggerCompletionNotification(task) {
  if (!task?.notifyOnComplete || task.status !== 'done') return;
  const summary = task.resultSummary || task.notes || task.title;
  const text = `任务已完成：${task.title}\n${summary}`;
  try {
    const sent = await sendDirectNotification(text);
    if (!sent) {
      await runOpenClaw(['system', 'event', '--text', text, '--mode', 'now']);
    }
  } catch (error) {
    console.error('Failed to trigger completion notification:', error.message);
  }
}

async function triggerBlockedNotification(task) {
  if (task.status !== 'blocked') return;
  const reason = task.lastError || '任务被阻塞，需要人工处理';
  const text = `任务被阻塞：${task.title}\n${reason}`;
  try {
    await sendDirectNotification(text);
  } catch (error) {
    console.error('Failed to trigger blocked notification:', error.message);
  }
}

function pickNextTask(tasks) {
  const list = tasks.tasks || [];
  const runnable = list.filter(task => task.autoRun && (task.status === 'in_progress' || task.status === 'todo'));
  runnable.sort((a, b) => {
    const aRank = a.status === 'in_progress' ? 1 : 0;
    const bRank = b.status === 'in_progress' ? 1 : 0;
    return bRank - aRank || (b.priority || 0) - (a.priority || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });
  return runnable[0] || null;
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
  return {
    total: all.length,
    completed: all.filter(task => task.status === 'done').length,
    pending: all.filter(task => task.status !== 'done').length,
    inProgress: all.filter(task => task.status === 'in_progress').length,
    blocked: all.filter(task => task.status === 'blocked').length,
    runnable: all.filter(task => task.autoRun && (task.status === 'todo' || task.status === 'in_progress')).length
  };
}

function updateTaskFields(task, patch = {}) {
  const previousStatus = task.status;
  for (const key of ['title', 'owner', 'type', 'notes', 'status', 'lastError', 'resultSummary']) {
    if (patch[key] !== undefined) task[key] = String(patch[key]);
  }
  for (const key of ['priority']) {
    if (patch[key] !== undefined) task[key] = Number(patch[key]);
  }
  for (const key of ['autoRun', 'notifyOnComplete']) {
    if (patch[key] !== undefined) task[key] = !!patch[key];
  }
  if (patch.startedAt !== undefined) task.startedAt = patch.startedAt;
  if (patch.completedAt !== undefined) task.completedAt = patch.completedAt;
  if (task.status === 'done' && !task.completedAt) task.completedAt = new Date().toISOString();
  if (task.status === 'in_progress' && !task.startedAt) task.startedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  return previousStatus;
}

async function runAutomationTick() {
  const automation = readAutomation();
  const tasks = readTasks();
  const task = pickNextTask(tasks);
  automation.lastHeartbeatRunAt = new Date().toISOString();

  if (!automation.enabled) {
    writeAutomation(automation);
    return { ok: true, ran: false, reason: 'automation_disabled' };
  }

  if (!task) {
    writeAutomation(automation);
    return { ok: true, ran: false, reason: 'no_runnable_task' };
  }

  const now = new Date().toISOString();
  if (task.status === 'todo') {
    updateTaskFields(task, {
      status: 'in_progress',
      startedAt: now,
      resultSummary: '自动执行器已接管该任务',
      lastError: ''
    });
    writeTasks(tasks);
    writeAutomation(automation);
    return { ok: true, ran: true, action: 'started', task };
  }

  if (task.status === 'in_progress') {
    const staleMs = now && task.updatedAt ? (Date.now() - new Date(task.updatedAt).getTime()) : 0;
    if (staleMs > 20 * 60 * 1000) {
      updateTaskFields(task, {
        status: 'blocked',
        lastError: '任务长时间无进展，已自动标记阻塞',
        resultSummary: task.resultSummary || ''
      });
      writeTasks(tasks);
      writeAutomation(automation);
      await triggerBlockedNotification(task);
      return { ok: true, ran: true, action: 'blocked', task };
    }
    updateTaskFields(task, {
      status: 'in_progress',
      resultSummary: `自动巡检继续推进中（${new Date().toLocaleString()}）`,
      lastError: ''
    });
    writeTasks(tasks);
    writeAutomation(automation);
    return { ok: true, ran: true, action: 'continued', task };
  }

  writeAutomation(automation);
  return { ok: true, ran: false, reason: 'unsupported_state' };
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
      const statusJson = parseJsonSafe(statusRaw, {});
      const sessionsJson = parseJsonSafe(sessionsRaw, {});
      const tasks = readTasks();
      const automation = readAutomation();
      sendJson(res, 200, {
        fetchedAt: new Date().toISOString(),
        openclaw: {
          status: statusJson,
          sessions: sessionsJson,
          agentHealth: inferAgentHealth(statusJson, sessionsJson)
        },
        automation: {
          ...automation,
          nextTask: pickNextTask(tasks)
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

    if (req.method === 'GET' && req.url === '/api/automation') {
      const tasks = readTasks();
      const automation = readAutomation();
      sendJson(res, 200, { ...automation, nextTask: pickNextTask(tasks) });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/automation/tick') {
      const result = await runAutomationTick();
      sendJson(res, 200, result);
      return;
    }

    if (req.method === 'PATCH' && req.url === '/api/automation') {
      const body = await readBody(req);
      const input = parseJsonSafe(body, {});
      const automation = readAutomation();
      if (input.enabled !== undefined) automation.enabled = !!input.enabled;
      if (input.mode !== undefined) automation.mode = String(input.mode);
      if (input.notify?.channel) automation.notify = { ...(automation.notify || {}), channel: String(input.notify.channel) };
      if (input.notify?.target) automation.notify = { ...(automation.notify || {}), target: String(input.notify.target) };
      if (input.notify?.account) automation.notify = { ...(automation.notify || {}), account: String(input.notify.account) };
      automation.updatedAt = new Date().toISOString();
      writeAutomation(automation);
      sendJson(res, 200, automation);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/tasks') {
      const body = await readBody(req);
      const input = parseJsonSafe(body, {});
      if (!input?.title) {
        sendJson(res, 400, { error: 'title is required' });
        return;
      }
      const tasks = readTasks();
      const now = new Date().toISOString();
      const task = {
        id: `task_${Date.now()}`,
        title: String(input.title),
        owner: input.owner ? String(input.owner) : 'gpt',
        type: input.type ? String(input.type) : 'general',
        priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 50,
        autoRun: input.autoRun !== undefined ? !!input.autoRun : true,
        notifyOnComplete: input.notifyOnComplete !== undefined ? !!input.notifyOnComplete : true,
        status: input.status ? String(input.status) : 'todo',
        notes: input.notes ? String(input.notes) : '',
        startedAt: null,
        completedAt: null,
        lastError: '',
        resultSummary: '',
        createdAt: now,
        updatedAt: now
      };
      tasks.tasks.unshift(task);
      writeTasks(tasks);
      sendJson(res, 201, task);
      return;
    }

    if (req.method === 'PATCH' && req.url.startsWith('/api/tasks/')) {
      const id = decodeURIComponent(req.url.split('/').pop());
      const body = await readBody(req);
      const input = parseJsonSafe(body, {});
      const tasks = readTasks();
      const task = tasks.tasks.find(item => item.id === id);
      if (!task) {
        sendJson(res, 404, { error: 'task not found' });
        return;
      }
      const previousStatus = updateTaskFields(task, input);
      writeTasks(tasks);
      if (previousStatus !== 'done' && task.status === 'done' && task.notifyOnComplete) {
        await triggerCompletionNotification(task);
      }
      if (previousStatus !== 'blocked' && task.status === 'blocked') {
        await triggerBlockedNotification(task);
      }
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
