const agentList = document.getElementById('agentList');
const taskList = document.getElementById('taskList');
const refreshBtn = document.getElementById('refreshBtn');
const taskForm = document.getElementById('taskForm');

function ageLabel(ms) {
  if (ms == null) return '未知';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  return `${day} 天前`;
}

function chipClass(state) {
  if (state === 'working' || state === 'done') return 'green';
  if (state === 'online') return 'blue';
  if (state === 'in_progress') return 'yellow';
  if (state === 'blocked' || state === 'offline') return 'red';
  return '';
}

function renderAgents(agents) {
  agentList.innerHTML = agents.map(agent => {
    const recentModel = agent.recentSession?.model || '未知';
    const context = agent.recentSession?.contextTokens || '-';
    return `
      <div class="agent">
        <div class="row">
          <div>
            <strong>${agent.id}${agent.primary ? ' · 主控制器' : ''}</strong>
            <div class="muted small">workspace: ${agent.workspaceDir}</div>
          </div>
          <span class="chip ${chipClass(agent.state)}">${agent.state}</span>
        </div>
        <div class="chips">
          <span class="chip">最近活跃：${ageLabel(agent.lastActiveAgeMs)}</span>
          <span class="chip">sessions: ${agent.sessionsCount}</span>
          <span class="chip ${agent.heartbeatEnabled ? 'blue' : ''}">heartbeat: ${agent.heartbeatEvery}</span>
          <span class="chip">model: ${recentModel}</span>
          <span class="chip">context: ${context}</span>
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

  taskList.innerHTML = tasks.map(task => `
    <div class="task">
      <div class="row">
        <strong>${task.title}</strong>
        <span class="chip ${chipClass(task.status)}">${task.status}</span>
      </div>
      <div class="chips">
        <span class="chip">owner: ${task.owner}</span>
        <span class="chip">priority: ${task.priority ?? '-'}</span>
        <span class="chip ${task.autoRun ? 'blue' : ''}">autoRun: ${task.autoRun ? 'on' : 'off'}</span>
        <span class="chip ${task.notifyOnComplete ? 'green' : ''}">notify: ${task.notifyOnComplete ? 'on' : 'off'}</span>
      </div>
      <div class="chips">
        <span class="chip">updated: ${new Date(task.updatedAt).toLocaleString()}</span>
        ${task.completedAt ? `<span class="chip green">completed: ${new Date(task.completedAt).toLocaleString()}</span>` : ''}
      </div>
      ${task.notes ? `<p class="muted small" style="margin-top:10px; line-height:1.5;">${task.notes}</p>` : ''}
      ${task.lastError ? `<p class="muted small" style="margin-top:8px; color:#ffadad;">阻塞：${task.lastError}</p>` : ''}
      ${task.resultSummary ? `<p class="muted small" style="margin-top:8px; color:#9ff0ba;">结果：${task.resultSummary}</p>` : ''}
      <div class="chips" style="margin-top:10px;">
        ${task.status !== 'in_progress' ? `<button class="btn" onclick="updateTask('${task.id}','in_progress')">标记进行中</button>` : ''}
        ${task.status !== 'done' ? `<button class="btn" onclick="updateTask('${task.id}','done')">标记完成</button>` : ''}
        ${task.status !== 'blocked' ? `<button class="btn" onclick="updateTask('${task.id}','blocked')">标记阻塞</button>` : ''}
        ${task.status !== 'todo' ? `<button class="btn" onclick="updateTask('${task.id}','todo')">退回 todo</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function loadOverview() {
  const res = await fetch('/api/overview');
  const data = await res.json();
  const agents = data.openclaw.agentHealth || [];
  const summary = data.taskSummary || { completed: 0, pending: 0 };
  const primary = agents.find(a => a.primary);
  const onlineCount = agents.filter(a => a.state === 'working' || a.state === 'online').length;
  document.getElementById('primaryAgent').textContent = primary?.id || '-';
  document.getElementById('onlineAgents').textContent = `${onlineCount}/${agents.length}`;
  document.getElementById('doneTasks').textContent = summary.completed;
  document.getElementById('pendingTasks').textContent = summary.pending;

  const gateway = data.openclaw.status?.gateway;
  const automation = data.automation || {};
  const nextTask = automation.nextTask;
  document.getElementById('gatewayStatus').textContent = gateway?.reachable
    ? `Gateway 已连接 · ${gateway.url} · 自动模式: ${automation.enabled ? '开启' : '关闭'}${nextTask ? ` · 下一任务: ${nextTask.title}` : ''}`
    : `Gateway 当前未直连（${gateway?.error || 'unknown'}）· 自动模式: ${automation.enabled ? '开启' : '关闭'}${nextTask ? ` · 下一任务: ${nextTask.title}` : ''}`;

  renderAgents(agents);
  renderTasks(data.tasks.tasks || []);
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
  await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
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
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  taskForm.reset();
  await loadOverview();
});

refreshBtn.addEventListener('click', loadOverview);
loadOverview();
setInterval(loadOverview, 15000);
