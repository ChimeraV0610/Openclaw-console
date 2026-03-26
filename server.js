const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3187;
const HOST = process.env.HOST || '127.0.0.1';
const BASE_PATH = ((process.env.BASE_PATH || '').trim().replace(/\/+$/, '')) || '';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const AUTOMATION_FILE = path.join(DATA_DIR, 'automation.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const TRADING_FILE = path.join(DATA_DIR, 'trading.json');

const DEFAULT_AUTOMATION = {
  enabled: true,
  mode: 'task-board',
  lastHeartbeatRunAt: null,
  lastNotificationAt: null
};

const DEFAULT_ACTIVITY = {
  meta: { version: 1, updatedAt: null },
  items: []
};

const DEFAULT_AGENT_DIRECTORY = {
  meta: { version: 1, updatedAt: null },
  teams: [],
  profiles: []
};

const DEFAULT_TRADING = {
  meta: { version: 1, updatedAt: null },
  summary: {
    mode: 'paper',
    focus: 'Phase 1 trading shell',
    lastUpdatedAt: null
  },
  watchlist: [],
  executionQueue: [],
  alerts: [],
  theses: []
};

fs.mkdirSync(DATA_DIR, { recursive: true });
ensureJsonFile(TASKS_FILE, { tasks: [] });
ensureJsonFile(AUTOMATION_FILE, DEFAULT_AUTOMATION);
ensureJsonFile(ACTIVITY_FILE, DEFAULT_ACTIVITY);
ensureJsonFile(AGENTS_FILE, DEFAULT_AGENT_DIRECTORY);
ensureJsonFile(TRADING_FILE, DEFAULT_TRADING);

function ensureJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function normalizeRequestPath(url) {
  const raw = (url || '/').split('?')[0] || '/';
  if (BASE_PATH) {
    if (raw === BASE_PATH) return '/';
    if (raw.startsWith(`${BASE_PATH}/`)) return raw.slice(BASE_PATH.length) || '/';
  }
  return raw;
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

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function readJsonFile(filePath, fallback) {
  return parseJsonSafe(fs.readFileSync(filePath, 'utf8'), clone(fallback));
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readTasks() {
  const data = readJsonFile(TASKS_FILE, { meta: {}, tasks: [] });
  data.meta = data.meta || {};
  data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  return data;
}

function writeTasks(data) {
  data.meta = { ...(data.meta || {}), updatedAt: new Date().toISOString() };
  writeJsonFile(TASKS_FILE, data);
}

function readAutomation() {
  return readJsonFile(AUTOMATION_FILE, DEFAULT_AUTOMATION);
}

function writeAutomation(data) {
  writeJsonFile(AUTOMATION_FILE, data);
}

function readActivity() {
  const data = readJsonFile(ACTIVITY_FILE, DEFAULT_ACTIVITY);
  data.meta = data.meta || {};
  data.items = Array.isArray(data.items) ? data.items : [];
  return data;
}

function writeActivity(data) {
  data.meta = { ...(data.meta || {}), updatedAt: new Date().toISOString() };
  writeJsonFile(ACTIVITY_FILE, data);
}

function readAgentDirectory() {
  const data = readJsonFile(AGENTS_FILE, DEFAULT_AGENT_DIRECTORY);
  data.meta = data.meta || {};
  data.teams = Array.isArray(data.teams) ? data.teams : [];
  data.profiles = Array.isArray(data.profiles) ? data.profiles : [];
  return data;
}

function writeAgentDirectory(data) {
  data.meta = { ...(data.meta || {}), updatedAt: new Date().toISOString() };
  writeJsonFile(AGENTS_FILE, data);
}

function readTrading() {
  const data = readJsonFile(TRADING_FILE, DEFAULT_TRADING);
  data.meta = data.meta || {};
  data.summary = data.summary || clone(DEFAULT_TRADING.summary);
  data.watchlist = Array.isArray(data.watchlist) ? data.watchlist : [];
  data.executionQueue = Array.isArray(data.executionQueue) ? data.executionQueue : [];
  data.alerts = Array.isArray(data.alerts) ? data.alerts : [];
  data.theses = Array.isArray(data.theses) ? data.theses : [];
  return data;
}

function writeTrading(data) {
  data.meta = { ...(data.meta || {}), updatedAt: new Date().toISOString() };
  data.summary = {
    ...(data.summary || {}),
    lastUpdatedAt: new Date().toISOString()
  };
  writeJsonFile(TRADING_FILE, data);
}

function normalizeTask(task) {
  return {
    ...task,
    page: task.page ? String(task.page) : 'tasks',
    acceptance: Array.isArray(task.acceptance) ? task.acceptance.map(item => String(item)) : [],
    tags: Array.isArray(task.tags) ? task.tags.map(item => String(item)) : []
  };
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
  return runnable[0] ? normalizeTask(runnable[0]) : null;
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

function summarizeTasksByPage(tasks) {
  const pages = ['home', 'agents', 'tasks', 'trading'];
  const summary = {};
  for (const page of pages) {
    const pageTasks = tasks.tasks.filter(task => (task.page || 'tasks') === page);
    summary[page] = {
      total: pageTasks.length,
      inProgress: pageTasks.filter(task => task.status === 'in_progress').length,
      blocked: pageTasks.filter(task => task.status === 'blocked').length,
      done: pageTasks.filter(task => task.status === 'done').length,
      topPriorityTask: pageTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null
    };
  }
  return summary;
}

function updateTaskFields(task, patch = {}) {
  const previousStatus = task.status;
  for (const key of ['title', 'owner', 'type', 'notes', 'status', 'lastError', 'resultSummary', 'page']) {
    if (patch[key] !== undefined) task[key] = String(patch[key]);
  }
  for (const key of ['priority']) {
    if (patch[key] !== undefined) task[key] = Number(patch[key]);
  }
  for (const key of ['autoRun', 'notifyOnComplete']) {
    if (patch[key] !== undefined) task[key] = !!patch[key];
  }
  if (patch.acceptance !== undefined && Array.isArray(patch.acceptance)) {
    task.acceptance = patch.acceptance.map(item => String(item));
  }
  if (patch.tags !== undefined && Array.isArray(patch.tags)) {
    task.tags = patch.tags.map(item => String(item));
  }
  if (patch.startedAt !== undefined) task.startedAt = patch.startedAt;
  if (patch.completedAt !== undefined) task.completedAt = patch.completedAt;
  if (task.status === 'done' && !task.completedAt) task.completedAt = new Date().toISOString();
  if (task.status === 'in_progress' && !task.startedAt) task.startedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  return previousStatus;
}

function appendActivity(entry) {
  const activity = readActivity();
  const now = new Date().toISOString();
  activity.items.unshift({
    id: entry.id || `activity_${Date.now()}`,
    type: entry.type || 'system',
    title: entry.title || 'Activity',
    summary: entry.summary || '',
    page: entry.page || 'home',
    owner: entry.owner || 'system',
    status: entry.status || 'info',
    importance: entry.importance || 'medium',
    taskId: entry.taskId || null,
    timestamp: entry.timestamp || now
  });
  activity.items = activity.items.slice(0, 100);
  writeActivity(activity);
}

function buildAgentsView(agentHealth, directory, tasks) {
  const profiles = directory.profiles || [];
  const tasksByOwner = new Map();
  for (const task of tasks.tasks || []) {
    const list = tasksByOwner.get(task.owner) || [];
    list.push(normalizeTask(task));
    tasksByOwner.set(task.owner, list);
  }

  return profiles.map(profile => {
    const health = agentHealth.find(item => item.id === profile.id) || null;
    const ownedTasks = tasksByOwner.get(profile.id) || [];
    return {
      ...profile,
      runtime: health,
      taskCounts: {
        total: ownedTasks.length,
        inProgress: ownedTasks.filter(task => task.status === 'in_progress').length,
        blocked: ownedTasks.filter(task => task.status === 'blocked').length,
        done: ownedTasks.filter(task => task.status === 'done').length
      },
      nextTask: ownedTasks
        .filter(task => task.status !== 'done')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null
    };
  });
}

function buildHomeSnapshot({ agentHealth, tasks, activity, trading, automation }) {
  const allTasks = tasks.tasks.map(normalizeTask);
  const nextTask = pickNextTask(tasks);
  const urgentTasks = allTasks
    .filter(task => task.status === 'blocked' || task.status === 'in_progress')
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 5);
  const recentActivity = activity.items
    .slice()
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 8);

  return {
    fetchedAt: new Date().toISOString(),
    summary: {
      automationEnabled: !!automation.enabled,
      nextTask,
      taskSummary: summarizeTasks(tasks),
      pageSummary: summarizeTasksByPage(tasks),
      onlineAgents: agentHealth.filter(agent => agent.state === 'working' || agent.state === 'online').length,
      totalAgents: agentHealth.length,
      openAlerts: (trading.alerts || []).filter(alert => alert.status !== 'closed').length,
      activeWatchlist: (trading.watchlist || []).filter(item => item.status !== 'closed').length
    },
    urgentTasks,
    recentActivity,
    trading: {
      summary: trading.summary,
      topWatchlist: (trading.watchlist || []).slice(0, 5),
      executionQueue: (trading.executionQueue || []).slice(0, 5),
      alerts: (trading.alerts || []).slice(0, 5)
    }
  };
}

function buildOverviewPayload(statusJson, sessionsJson) {
  const tasks = readTasks();
  const automation = readAutomation();
  const activity = readActivity();
  const trading = readTrading();
  const directory = readAgentDirectory();
  const agentHealth = inferAgentHealth(statusJson, sessionsJson);

  return {
    fetchedAt: new Date().toISOString(),
    openclaw: {
      status: statusJson,
      sessions: sessionsJson,
      agentHealth
    },
    automation: {
      ...automation,
      nextTask: pickNextTask(tasks)
    },
    tasks: {
      ...tasks,
      tasks: tasks.tasks.map(normalizeTask)
    },
    taskSummary: summarizeTasks(tasks),
    pages: {
      home: buildHomeSnapshot({ agentHealth, tasks, activity, trading, automation }),
      agents: {
        teams: directory.teams,
        profiles: buildAgentsView(agentHealth, directory, tasks),
        activity: activity.items.slice(0, 20)
      },
      trading
    }
  };
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
  const taskRef = tasks.tasks.find(item => item.id === task.id);
  if (!taskRef) {
    writeAutomation(automation);
    return { ok: false, ran: false, reason: 'task_missing' };
  }

  if (taskRef.status === 'todo') {
    updateTaskFields(taskRef, {
      status: 'in_progress',
      startedAt: now,
      resultSummary: '自动执行器已接管该任务',
      lastError: ''
    });
    writeTasks(tasks);
    appendActivity({
      type: 'automation',
      title: 'Automation started task',
      summary: taskRef.title,
      page: taskRef.page || 'tasks',
      owner: taskRef.owner || 'automation',
      status: 'in_progress',
      importance: 'high',
      taskId: taskRef.id,
      timestamp: now
    });
    writeAutomation(automation);
    return { ok: true, ran: true, action: 'started', task: normalizeTask(taskRef) };
  }

  if (taskRef.status === 'in_progress') {
    const staleMs = now && taskRef.updatedAt ? (Date.now() - new Date(taskRef.updatedAt).getTime()) : 0;
    if (staleMs > 20 * 60 * 1000) {
      updateTaskFields(taskRef, {
        status: 'blocked',
        lastError: '任务长时间无进展，已自动标记阻塞',
        resultSummary: taskRef.resultSummary || ''
      });
      writeTasks(tasks);
      appendActivity({
        type: 'automation',
        title: 'Automation blocked stale task',
        summary: taskRef.title,
        page: taskRef.page || 'tasks',
        owner: taskRef.owner || 'automation',
        status: 'blocked',
        importance: 'high',
        taskId: taskRef.id,
        timestamp: now
      });
      writeAutomation(automation);
      await triggerBlockedNotification(taskRef);
      return { ok: true, ran: true, action: 'blocked', task: normalizeTask(taskRef) };
    }
    updateTaskFields(taskRef, {
      status: 'in_progress',
      resultSummary: `自动巡检继续推进中（${new Date().toLocaleString()}）`,
      lastError: ''
    });
    writeTasks(tasks);
    appendActivity({
      type: 'automation',
      title: 'Automation heartbeat touched task',
      summary: taskRef.title,
      page: taskRef.page || 'tasks',
      owner: taskRef.owner || 'automation',
      status: 'in_progress',
      importance: 'medium',
      taskId: taskRef.id,
      timestamp: now
    });
    writeAutomation(automation);
    return { ok: true, ran: true, action: 'continued', task: normalizeTask(taskRef) };
  }

  writeAutomation(automation);
  return { ok: true, ran: false, reason: 'unsupported_state' };
}

function serveStatic(req, res, requestPath) {
  const requested = requestPath === '/' ? '/index.html' : requestPath;
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
    if (ext === '.html') {
      const html = data.toString('utf8').replace(/__BASE_PATH__/g, BASE_PATH);
      sendText(res, 200, html, contentType);
      return;
    }
    sendText(res, 200, data, contentType);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = normalizeRequestPath(req.url);
    if (req.method === 'GET' && requestPath === '/api/health') {
      sendJson(res, 200, { ok: true, service: 'openclaw-agent-dashboard', time: new Date().toISOString() });
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/overview') {
      const [statusRaw, sessionsRaw] = await Promise.all([
        runOpenClaw(['status', '--json']),
        runOpenClaw(['sessions', '--all-agents', '--json'])
      ]);
      const statusJson = parseJsonSafe(statusRaw, {});
      const sessionsJson = parseJsonSafe(sessionsRaw, {});
      sendJson(res, 200, buildOverviewPayload(statusJson, sessionsJson));
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/home') {
      const [statusRaw, sessionsRaw] = await Promise.all([
        runOpenClaw(['status', '--json']),
        runOpenClaw(['sessions', '--all-agents', '--json'])
      ]);
      const statusJson = parseJsonSafe(statusRaw, {});
      const sessionsJson = parseJsonSafe(sessionsRaw, {});
      const agentHealth = inferAgentHealth(statusJson, sessionsJson);
      sendJson(res, 200, buildHomeSnapshot({
        agentHealth,
        tasks: readTasks(),
        activity: readActivity(),
        trading: readTrading(),
        automation: readAutomation()
      }));
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/tasks') {
      const tasks = readTasks();
      sendJson(res, 200, { ...tasks, tasks: tasks.tasks.map(normalizeTask) });
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/agents') {
      const [statusRaw, sessionsRaw] = await Promise.all([
        runOpenClaw(['status', '--json']),
        runOpenClaw(['sessions', '--all-agents', '--json'])
      ]);
      const statusJson = parseJsonSafe(statusRaw, {});
      const sessionsJson = parseJsonSafe(sessionsRaw, {});
      const agentHealth = inferAgentHealth(statusJson, sessionsJson);
      const directory = readAgentDirectory();
      const tasks = readTasks();
      sendJson(res, 200, {
        fetchedAt: new Date().toISOString(),
        teams: directory.teams,
        profiles: buildAgentsView(agentHealth, directory, tasks),
        activity: readActivity().items.slice(0, 20)
      });
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/activity') {
      sendJson(res, 200, readActivity());
      return;
    }

    if (req.method === 'POST' && requestPath === '/api/activity') {
      const body = await readBody(req);
      const input = parseJsonSafe(body, {});
      if (!input?.title) {
        sendJson(res, 400, { error: 'title is required' });
        return;
      }
      appendActivity(input);
      sendJson(res, 201, { ok: true });
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/trading') {
      sendJson(res, 200, readTrading());
      return;
    }

    if (req.method === 'PATCH' && requestPath === '/api/trading') {
      const body = await readBody(req);
      const input = parseJsonSafe(body, {});
      const trading = readTrading();
      if (input.summary && typeof input.summary === 'object') {
        trading.summary = { ...trading.summary, ...input.summary };
      }
      for (const key of ['watchlist', 'executionQueue', 'alerts', 'theses']) {
        if (Array.isArray(input[key])) trading[key] = input[key];
      }
      writeTrading(trading);
      appendActivity({
        type: 'trading',
        title: 'Trading store updated',
        summary: input.summary?.focus || 'Trading data changed',
        page: 'trading',
        owner: 'backend-engineer',
        status: 'updated',
        importance: 'medium'
      });
      sendJson(res, 200, trading);
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/automation') {
      const tasks = readTasks();
      const automation = readAutomation();
      sendJson(res, 200, { ...automation, nextTask: pickNextTask(tasks) });
      return;
    }

    if (req.method === 'POST' && requestPath === '/api/automation/tick') {
      const result = await runAutomationTick();
      sendJson(res, 200, result);
      return;
    }

    if (req.method === 'PATCH' && requestPath === '/api/automation') {
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

    if (req.method === 'POST' && requestPath === '/api/tasks') {
      const body = await readBody(req);
      const input = parseJsonSafe(body, {});
      if (!input?.title) {
        sendJson(res, 400, { error: 'title is required' });
        return;
      }
      const tasks = readTasks();
      const now = new Date().toISOString();
      const task = normalizeTask({
        id: `task_${Date.now()}`,
        title: String(input.title),
        owner: input.owner ? String(input.owner) : 'gpt',
        type: input.type ? String(input.type) : 'general',
        page: input.page ? String(input.page) : 'tasks',
        priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 50,
        autoRun: input.autoRun !== undefined ? !!input.autoRun : true,
        notifyOnComplete: input.notifyOnComplete !== undefined ? !!input.notifyOnComplete : true,
        status: input.status ? String(input.status) : 'todo',
        notes: input.notes ? String(input.notes) : '',
        acceptance: Array.isArray(input.acceptance) ? input.acceptance.map(item => String(item)) : [],
        tags: Array.isArray(input.tags) ? input.tags.map(item => String(item)) : [],
        startedAt: null,
        completedAt: null,
        lastError: '',
        resultSummary: '',
        createdAt: now,
        updatedAt: now
      });
      tasks.tasks.unshift(task);
      writeTasks(tasks);
      appendActivity({
        type: 'task',
        title: 'Task created',
        summary: task.title,
        page: task.page,
        owner: task.owner,
        status: task.status,
        importance: task.priority >= 90 ? 'high' : 'medium',
        taskId: task.id,
        timestamp: now
      });
      sendJson(res, 201, task);
      return;
    }

    if (req.method === 'PATCH' && requestPath.startsWith('/api/tasks/')) {
      const id = decodeURIComponent(requestPath.split('/').pop());
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
      appendActivity({
        type: 'task',
        title: 'Task updated',
        summary: `${task.title} → ${task.status}`,
        page: task.page || 'tasks',
        owner: task.owner,
        status: task.status,
        importance: task.status === 'blocked' ? 'high' : 'medium',
        taskId: task.id
      });
      if (previousStatus !== 'done' && task.status === 'done' && task.notifyOnComplete) {
        await triggerCompletionNotification(task);
      }
      if (previousStatus !== 'blocked' && task.status === 'blocked') {
        await triggerBlockedNotification(task);
      }
      sendJson(res, 200, normalizeTask(task));
      return;
    }

    if (req.method === 'GET' && requestPath === '/api/plan/backend-phase1') {
      sendJson(res, 200, {
        objective: 'Extend the existing dashboard backend for Home / Agents / Tasks / Trading without a greenfield rewrite.',
        stores: {
          tasks: 'Existing task board + automation source of truth, now normalized with page / acceptance / tags support.',
          activity: 'New append-only activity feed for Home and Agents summaries.',
          agents: 'New agent directory for role/ownership metadata layered on top of live OpenClaw runtime health.',
          trading: 'New trading shell store for watchlist, execution queue, alerts, and thesis panels.'
        },
        endpoints: [
          'GET /api/overview',
          'GET /api/home',
          'GET /api/agents',
          'GET /api/tasks',
          'GET /api/activity',
          'POST /api/activity',
          'GET /api/trading',
          'PATCH /api/trading',
          'GET /api/automation',
          'POST /api/automation/tick',
          'PATCH /api/automation',
          'POST /api/tasks',
          'PATCH /api/tasks/:id'
        ],
        phase1Notes: [
          'Home is composed from tasks + activity + trading + runtime health.',
          'Agents merges static role metadata with live OpenClaw status/sessions.',
          'Tasks keeps existing workflow compatible while allowing richer page-scoped planning.',
          'Trading is intentionally a shell store for frontend iteration, not a live execution engine.'
        ]
      });
      return;
    }

    serveStatic(req, res, requestPath);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(PORT, HOST, () => {
  const shownBase = BASE_PATH || '/';
  console.log(`OpenClaw Agent Dashboard running at http://${HOST}:${PORT}${shownBase}`);
});
