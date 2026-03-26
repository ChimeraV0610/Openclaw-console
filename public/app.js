const agentList = document.getElementById('agentList');
const taskList = document.getElementById('taskList');
const refreshBtn = document.getElementById('refreshBtn');
const taskForm = document.getElementById('taskForm');
const tickBtn = document.getElementById('tickBtn');
const automationToggleBtn = document.getElementById('automationToggleBtn');
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
const views = Array.from(document.querySelectorAll('[data-view-panel]'));

const viewMeta = {
  home: {
    eyebrow: 'Console',
    title: 'Home',
    description: '总览自动执行、当前焦点和 phase 1 shell 的核心状态。'
  },
  agents: {
    eyebrow: 'Operations',
    title: 'Agents',
    description: '看每个 agent 的在线状态、workspace、session 和 heartbeat。'
  },
  tasks: {
    eyebrow: 'Execution',
    title: 'Tasks',
    description: '保留现有任务工作流：新建、标记状态、汇总结果。'
  },
  trading: {
    eyebrow: 'Trader Workspace',
    title: 'Trading',
    description: '先上线最小 trading shell，用当前任务和 agent 信号填充 workflow。'
  }
};

let latestOverview = null;
let currentView = 'home';
let selectedTradingItemId = null;
const BASE_PATH = (window.OPENCLAW_BASE_PATH || '').replace(/\/$/, '');
const apiPath = (path) => `${BASE_PATH}${path}`;

function ageLabel(ms) {
  if (ms == null || Number.isNaN(ms)) return '未知';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  return `${day} 天前`;
}

function timeAgoFromIso(iso) {
  if (!iso) return '未记录';
  return ageLabel(Date.now() - new Date(iso).getTime());
}

function chipClass(state) {
  if (state === 'working' || state === 'done') return 'green';
  if (state === 'online') return 'blue';
  if (state === 'in_progress') return 'yellow';
  if (state === 'blocked' || state === 'offline') return 'red';
  return '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function setView(view) {
  currentView = view;
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  views.forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === view));

  const meta = viewMeta[view] || viewMeta.home;
  document.getElementById('viewEyebrow').textContent = meta.eyebrow;
  document.getElementById('viewTitle').textContent = meta.title;
  document.getElementById('viewDescription').textContent = meta.description;
}

function renderAgents(agents) {
  agentList.innerHTML = agents.map((agent) => {
    const recentModel = agent.recentSession?.model || '未知';
    const context = agent.recentSession?.contextTokens || '-';
    return `
      <div class="agent">
        <div class="row">
          <div>
            <strong>${escapeHtml(agent.id)}${agent.primary ? ' · 主控制器' : ''}</strong>
            <div class="muted small">workspace: ${escapeHtml(agent.workspaceDir || '-')}</div>
          </div>
          <span class="chip ${chipClass(agent.state)}">${escapeHtml(agent.state || 'unknown')}</span>
        </div>
        <div class="chips">
          <span class="chip">最近活跃：${escapeHtml(ageLabel(agent.lastActiveAgeMs))}</span>
          <span class="chip">sessions: ${escapeHtml(agent.sessionsCount ?? '-')}</span>
          <span class="chip ${agent.heartbeatEnabled ? 'blue' : ''}">heartbeat: ${escapeHtml(agent.heartbeatEvery || 'off')}</span>
          <span class="chip">model: ${escapeHtml(recentModel)}</span>
          <span class="chip">context: ${escapeHtml(context)}</span>
          ${agent.bootstrapPending ? '<span class="chip red">bootstrap pending</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderTasks(tasks) {
  if (!tasks.length) {
    taskList.innerHTML = '<div class="task muted">还没有任务。先把第一条建起来。</div>';
    return;
  }

  taskList.innerHTML = tasks.map((task) => `
    <div class="task">
      <div class="row">
        <strong>${escapeHtml(task.title)}</strong>
        <span class="chip ${chipClass(task.status)}">${escapeHtml(task.status)}</span>
      </div>
      <div class="chips">
        <span class="chip">owner: ${escapeHtml(task.owner || '-')}</span>
        <span class="chip">priority: ${escapeHtml(task.priority ?? '-')}</span>
        <span class="chip ${task.autoRun ? 'blue' : ''}">autoRun: ${task.autoRun ? 'on' : 'off'}</span>
        <span class="chip ${task.notifyOnComplete ? 'green' : ''}">notify: ${task.notifyOnComplete ? 'on' : 'off'}</span>
        ${task.page ? `<span class="chip">page: ${escapeHtml(task.page)}</span>` : ''}
      </div>
      <div class="chips">
        <span class="chip">updated: ${escapeHtml(formatTime(task.updatedAt))}</span>
        ${task.completedAt ? `<span class="chip green">completed: ${escapeHtml(formatTime(task.completedAt))}</span>` : ''}
      </div>
      ${task.notes ? `<p class="muted small" style="margin-top:10px; line-height:1.5;">${escapeHtml(task.notes)}</p>` : ''}
      ${task.lastError ? `<p class="muted small" style="margin-top:8px; color:#ffadad;">阻塞：${escapeHtml(task.lastError)}</p>` : ''}
      ${task.resultSummary ? `<p class="muted small" style="margin-top:8px; color:#9ff0ba;">结果：${escapeHtml(task.resultSummary)}</p>` : ''}
      <div class="chips" style="margin-top:10px;">
        ${task.status !== 'in_progress' ? `<button class="btn" onclick="updateTask('${escapeHtml(task.id)}','in_progress')">标记进行中</button>` : ''}
        ${task.status !== 'done' ? `<button class="btn" onclick="updateTask('${escapeHtml(task.id)}','done')">标记完成</button>` : ''}
        ${task.status !== 'blocked' ? `<button class="btn" onclick="updateTask('${escapeHtml(task.id)}','blocked')">标记阻塞</button>` : ''}
        ${task.status !== 'todo' ? `<button class="btn" onclick="updateTask('${escapeHtml(task.id)}','todo')">退回 todo</button>` : ''}
      </div>
    </div>
  `).join('');
}

function renderHome(data) {
  const tasks = data.tasks?.tasks || [];
  const agents = data.openclaw?.agentHealth || [];
  const nextTask = data.automation?.nextTask;
  const blockedTasks = tasks.filter((task) => task.status === 'blocked');
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress');
  const offlineAgents = agents.filter((agent) => agent.state === 'offline');

  const focusItems = [];
  if (nextTask) {
    focusItems.push({
      title: '自动执行下一任务',
      badge: nextTask.status,
      body: `${nextTask.title} · owner ${nextTask.owner || '-'} · priority ${nextTask.priority ?? '-'}`
    });
  }
  if (blockedTasks[0]) {
    focusItems.push({
      title: '阻塞任务待处理',
      badge: 'blocked',
      body: `${blockedTasks[0].title} · ${blockedTasks[0].lastError || '需要人工处理或更多上下文'}`
    });
  }
  if (inProgressTasks[0]) {
    focusItems.push({
      title: '进行中交付',
      badge: 'in_progress',
      body: `${inProgressTasks[0].title} · 最近更新 ${timeAgoFromIso(inProgressTasks[0].updatedAt)}`
    });
  }
  if (offlineAgents[0]) {
    focusItems.push({
      title: 'Agent 风险信号',
      badge: offlineAgents[0].state,
      body: `${offlineAgents[0].id} 当前离线，检查 gateway / pairing / runtime。`
    });
  }

  const focusRoot = document.getElementById('homeFocus');
  if (!focusItems.length) {
    focusRoot.innerHTML = '<div class="empty-state">目前没有显著异常；可以继续推进 phase 1 四页交付。</div>';
    return;
  }

  focusRoot.innerHTML = focusItems.map((item) => `
    <div class="list-card">
      <div class="list-card-title">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="chip ${chipClass(item.badge)}">${escapeHtml(item.badge)}</span>
      </div>
      <p class="muted small">${escapeHtml(item.body)}</p>
    </div>
  `).join('');
}

function renderTrading(data) {
  const tasks = [...(data.tasks?.tasks || [])];
  const agents = data.openclaw?.agentHealth || [];
  const tradingStore = data.pages?.trading || data.trading || {};

  const watchlist = (Array.isArray(tradingStore.watchlist) && tradingStore.watchlist.length
    ? tradingStore.watchlist.map((item, index) => ({
        id: item.id || `watch_${index}`,
        title: item.symbol || item.title || `Watch ${index + 1}`,
        status: item.bias || 'watch',
        owner: item.owner || 'trading-desk',
        notes: item.summary || item.catalyst || 'Awaiting deeper market data.',
        page: 'trading',
        priority: item.priority ?? 70,
        instrument: item.instrument || 'market',
        timeframe: item.timeframe || 'active',
        nextAction: item.nextAction || 'Review setup'
      }))
    : tasks.filter((task) => task.status !== 'done').sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 4));

  const executionQueue = (Array.isArray(tradingStore.executionQueue) && tradingStore.executionQueue.length
    ? tradingStore.executionQueue.map((item, index) => ({
        id: item.id || `queue_${index}`,
        title: item.symbol || item.title || `Queue ${index + 1}`,
        status: item.status || 'queued',
        owner: item.owner || 'trading-desk',
        notes: item.trigger || item.summary || 'Waiting for trigger.',
        page: 'trading',
        priority: item.priority ?? 65,
        nextAction: item.nextAction || 'Review setup'
      }))
    : tasks.filter((task) => task.status === 'in_progress' || task.autoRun).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 4));

  const tradingTagged = tasks.filter((task) => task.page === 'trading' || /trading/i.test(task.owner || '') || /trading/i.test(task.title || ''));
  const alerts = [
    ...tasks.filter((task) => task.status === 'blocked').map((task) => ({
      title: task.title,
      body: task.lastError || 'Blocked task requiring intervention.',
      tone: 'red'
    })),
    ...agents.filter((agent) => agent.state === 'offline').map((agent) => ({
      title: `${agent.id} offline`,
      body: 'Review runtime, gateway, or heartbeat connectivity for this agent.',
      tone: 'red'
    }))
  ].slice(0, 4);

  document.getElementById('tradingSummary').innerHTML = [
    {
      label: 'Priority queue',
      value: `${watchlist.length}`,
      body: 'Highest-priority watchlist items currently tracked by the desk.'
    },
    {
      label: 'Execution now',
      value: `${executionQueue.length}`,
      body: 'Queued and in-progress items moving toward execution.'
    },
    {
      label: 'Risk flags',
      value: `${alerts.length}`,
      body: 'Blocked tasks, offline agents, and risk conditions needing attention.'
    },
    {
      label: 'Trading hooks',
      value: `${tradingTagged.length}`,
      body: 'Linked tasks and context feeding the trading workflow.'
    }
  ].map((item) => `
    <div class="summary-band">
      <div class="info-label">${escapeHtml(item.label)}</div>
      <div class="stat-value compact">${escapeHtml(item.value)}</div>
      <p class="muted small">${escapeHtml(item.body)}</p>
    </div>
  `).join('');

  if (!selectedTradingItemId || !watchlist.some((item) => item.id === selectedTradingItemId)) {
    selectedTradingItemId = watchlist[0]?.id || executionQueue[0]?.id || null;
  }
  const selectedTradingItem = watchlist.find((item) => item.id === selectedTradingItemId) || executionQueue.find((item) => item.id === selectedTradingItemId) || null;

  renderCardList('tradingWatchlist', watchlist, (task) => ({
    title: task.title,
    badge: task.priority ?? '-',
    badgeTone: task.id === selectedTradingItemId ? 'green' : task.status,
    body: `${task.owner || '-'} � ${task.status} � ${task.notes || 'Waiting for richer market or thesis detail.'}`,
    active: task.id === selectedTradingItemId,
    dataId: task.id
  }), 'No watchlist data yet. Trading domain API can deepen this next.');

  renderCardList('executionQueue', executionQueue, (task) => ({
    title: task.title,
    badge: task.status,
    badgeTone: task.status,
    body: `${task.owner || '-'} � ${task.nextAction || `autoRun ${task.autoRun ? 'on' : 'off'}`} � updated ${timeAgoFromIso(task.updatedAt)}`,
    active: task.id === selectedTradingItemId,
    dataId: task.id
  }), 'No active execution items right now.');

  const thesisRoot = document.getElementById('tradingThesis');
  if (thesisRoot) {
    thesisRoot.innerHTML = selectedTradingItem
      ? `
        <div class="list-card list-card-active">
          <div class="list-card-title">
            <strong>${escapeHtml(selectedTradingItem.title)}</strong>
            <span class="chip ${chipClass(selectedTradingItem.status || 'blue')}">${escapeHtml(selectedTradingItem.status || 'watch')}</span>
          </div>
          <p class="muted small"><strong>Owner:</strong> ${escapeHtml(selectedTradingItem.owner || '-')}</p>
          <p class="muted small"><strong>Thesis:</strong> ${escapeHtml(selectedTradingItem.notes || 'Current thesis detail is still shallow; backend trading data can deepen this next.')}</p>
          <p class="muted small"><strong>Next action:</strong> ${escapeHtml(selectedTradingItem.nextAction || 'Review setup / confirm trigger / link task')}</p>
          <p class="muted small"><strong>Why now:</strong> ${escapeHtml(selectedTradingItem.timeframe || selectedTradingItem.instrument || 'Active context')}</p>
        </div>
      `
      : '<div class="empty-state">Select a watchlist or queue item to inspect the active thesis and next action.</div>';
  }

  renderCardList('linkedTasks', tradingTagged.length ? tradingTagged : watchlist, (task) => ({
    title: task.title,
    badge: task.page || 'trading',
    badgeTone: task.status || 'blue',
    body: `${task.owner || '-'} � ${task.notes || task.summary || 'Task linked to the trading workflow.'}`
  }), 'No linked tasks yet.');

  renderCardList('tradingAlerts', alerts, (alert) => ({
    title: alert.title,
    badge: alert.tone === 'red' ? 'urgent' : 'watch',
    badgeTone: alert.tone,
    body: alert.body
  }), 'No active trading alerts.');
}
function renderCardList(elementId, items, mapper, emptyText) {
  const root = document.getElementById(elementId);
  if (!root) return;
  if (!items.length) {
    root.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    return;
  }

  root.innerHTML = items.map((item) => {
    const mapped = mapper(item);
    return `
      <button class="list-card list-card-button ${mapped.active ? 'list-card-active' : ''}" ${mapped.dataId ? `data-trading-select="${escapeHtml(mapped.dataId)}"` : ''}>
        <div class="list-card-title">
          <strong>${escapeHtml(mapped.title)}</strong>
          <span class="chip ${chipClass(mapped.badgeTone)}">${escapeHtml(mapped.badge)}</span>
        </div>
        <p class="muted small">${escapeHtml(mapped.body)}</p>
      </button>
    `;
  }).join('');
}

function updateSidebar(data) {
  const gateway = data.openclaw?.status?.gateway;
  const automation = data.automation || {};
  const dot = document.getElementById('gatewayDot');
  const status = gateway?.reachable ? 'Gateway online' : 'Gateway degraded';
  dot.className = `status-dot ${gateway?.reachable ? 'online' : 'offline'}`;
  document.getElementById('gatewayMiniStatus').textContent = `${status} · automation ${automation.enabled ? 'on' : 'off'}`;

  const summary = data.taskSummary || { completed: 0, pending: 0 };
  document.getElementById('sidebarChips').innerHTML = `
    <span class="chip ${automation.enabled ? 'blue' : ''}">automation ${automation.enabled ? 'on' : 'off'}</span>
    <span class="chip green">done ${escapeHtml(summary.completed)}</span>
    <span class="chip yellow">pending ${escapeHtml(summary.pending)}</span>
  `;
}

async function loadOverview() {
  const res = await fetch(apiPath('/api/overview'));
  const data = await res.json();
  latestOverview = data;

  const agents = data.openclaw?.agentHealth || [];
  const summary = data.taskSummary || { completed: 0, pending: 0 };
  const primary = agents.find((agent) => agent.primary);
  const onlineCount = agents.filter((agent) => agent.state === 'working' || agent.state === 'online').length;

  document.getElementById('primaryAgent').textContent = primary?.id || '-';
  document.getElementById('onlineAgents').textContent = `${onlineCount}/${agents.length}`;
  document.getElementById('doneTasks').textContent = summary.completed;
  document.getElementById('pendingTasks').textContent = summary.pending;

  const gateway = data.openclaw?.status?.gateway;
  const automation = data.automation || {};
  const nextTask = automation.nextTask;
  document.getElementById('gatewayStatus').textContent = gateway?.reachable
    ? `Gateway 已连接 · ${gateway.url} · 自动模式: ${automation.enabled ? '开启' : '关闭'}${nextTask ? ` · 下一任务: ${nextTask.title}` : ''}`
    : `Gateway 当前未直连（${gateway?.error || 'unknown'}）· 自动模式: ${automation.enabled ? '开启' : '关闭'}${nextTask ? ` · 下一任务: ${nextTask.title}` : ''}`;

  document.getElementById('automationMode').textContent = automation.enabled ? '开启' : '关闭';
  document.getElementById('automationNextTask').textContent = nextTask
    ? `当前选中任务：${nextTask.title}（${nextTask.status}）`
    : '当前没有可自动执行的任务';
  document.getElementById('lastHeartbeat').textContent = timeAgoFromIso(automation.lastHeartbeatRunAt);
  document.getElementById('lastHeartbeatExact').textContent = automation.lastHeartbeatRunAt
    ? `上次运行：${formatTime(automation.lastHeartbeatRunAt)} · 最近通知：${automation.lastNotificationAt ? formatTime(automation.lastNotificationAt) : '-'}`
    : '还没有 heartbeat 记录';

  if (automationToggleBtn) {
    automationToggleBtn.textContent = automation.enabled ? '关闭自动执行' : '开启自动执行';
  }

  renderAgents(agents);
  renderTasks(data.tasks?.tasks || []);
  renderHome(data);
  renderTrading(data);
  updateSidebar(data);
}

async function updateTask(id, status) {
  const patch = { status };
  if (status === 'done') {
    patch.completedAt = new Date().toISOString();
    patch.resultSummary = '已手动标记完成';
    patch.lastError = '';
  }
  if (status === 'blocked') {
    patch.lastError = '需要人工处理或更多上下文';
  }
  await fetch(apiPath(`/api/tasks/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  await loadOverview();
}
window.updateTask = updateTask;

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const payload = Object.fromEntries(formData.entries());
  await fetch(apiPath('/api/tasks'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  taskForm.reset();
  await loadOverview();
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-trading-select]');
  if (!target) return;
  selectedTradingItemId = target.getAttribute('data-trading-select');
  if (latestOverview) renderTrading(latestOverview);
});

if (tickBtn) {
  tickBtn.addEventListener('click', async () => {
    await fetch(apiPath('/api/automation/tick'), { method: 'POST' });
    await loadOverview();
  });
}

if (automationToggleBtn) {
  automationToggleBtn.addEventListener('click', async () => {
    const current = document.getElementById('automationMode').textContent === '开启';
    await fetch(apiPath('/api/automation'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !current })
    });
    await loadOverview();
  });
}

refreshBtn.addEventListener('click', loadOverview);
setView(currentView);
loadOverview();
setInterval(loadOverview, 15000);
setInterval(async () => {
  const current = document.getElementById('automationMode')?.textContent;
  if (current === '开启') {
    await fetch(apiPath('/api/automation/tick'), { method: 'POST' });
    await loadOverview();
  }
}, 60000);

