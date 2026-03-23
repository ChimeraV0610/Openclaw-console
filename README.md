# OpenClaw Agent Dashboard

一个从零开始的单控制器 dashboard，用来替代多模型混协作的混乱状态。

## 目标

- 展示 OpenClaw agent 在线/离线/工作中状态
- 展示最近 session / model / heartbeat 信息
- 展示已完成 / 未完成任务
- 后续可扩展到：停用非主 agent、重启 gateway、任务分配与执行记录

## 运行

```bash
npm start
```

然后打开：

- <http://127.0.0.1:3187>

## 数据来源

Dashboard 目前通过本机 CLI 读取：

- `openclaw status --json`
- `openclaw sessions --all-agents --json`

任务数据存放在：

- `data/tasks.json`

## 当前限制

- 这是 MVP，不会直接改 OpenClaw 配置
- “停用其他模型” 还没接成按钮；下一步可以继续做
- Gateway 当前有 `missing scope: operator.read`，所以页面会展示“CLI 可读、网关未直连”的状态
