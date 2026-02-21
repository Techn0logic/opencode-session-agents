# OpenCode Multi-Agent Orchestration Examples

> **Note**: This is an early version/ideation of the multi-agent orchestration approach. The implementation demonstrates delegating tasks to sub-agents running in separate sessions.

## Overview

This directory contains examples of a multi-agent orchestration system where:
- **Orchestrator** (`orchestrator/`) - A primary agent that delegates tasks to sub-agents
- **Agent 1** (`agent_1/`) - Frontend specialist (React, Vue, HTML, CSS)
- **Agent 2** (`agent_2/`) - Backend specialist (API, database, server logic)

Each agent runs in its own sub-session with its own configuration, allowing parallel work execution.

## Prerequisites

1. OpenCode installed (see [Tested Versions](#tested-versions) below)
2. The orchestration plugin built/installed:
   ```bash
   cd opencode-orchestration
   npm install
   npm run build
   ```

## Tested Versions

- **OpenCode**: Latest stable (v1.x)
- **Plugin**: opencode-session-agents v1.0.0

## Plugin Setup

The orchestrator uses the `opencode-session-agents` plugin. You have two options:

### Option 1: Use as npm package (recommended)
```json
{
  "plugin": ["opencode-session-agents"]
}
```

### Option 2: Local plugin (for development)
Create `.opencode/plugins/session-agents.js`:

```javascript
import { SessionAgentsPlugin } from "opencode-session-agents"
export default SessionAgentsPlugin
```

Then reference it in `opencode.json`:
```json
{
  "plugin": [".opencode/plugins/session-agents"]
}
```

## Directory Structure

```
examples/
├── orchestrator/          # Primary agent that delegates work
│   ├── AGENT.md           # Orchestrator role definition
│   ├── opencode.json      # Config with orchestrator agent
│   └── prompt_agent_1.txt # Example prompt for delegation to agent_1 sub-agent
│   └── prompt_agent_2.txt # Example prompt for delegation to agent_2 sub-agent
├── agent_1/               # Frontend specialist
│   ├── AGENT.md           # Frontend agent role
│   └── opencode.json      # Agent config with custom model/temperature
└── agent_2/               # Backend specialist
    ├── AGENT.md           # Backend agent role
    └── opencode.json      # Agent config with custom model/temperature
```

## Sub-Agent Configuration

Each sub-agent has its own `opencode.json` with **custom parameters** that are enforced when the agent executes tasks:

### Agent 1 (Frontend)
```json
{
  "agent": {
    "agent_1": {
      "mode": "primary",
      "model": "opencode/gpt-5-nano",
      "temperature": 0.8
    }
  }
}
```
- **Model**: `opencode/gpt-5-nano` (for frontend design and creativity)
- **Temperature**: `0.8` (higher for design creativity)
- **Tools**: All tools enabled

### Agent 2 (Backend)
```json
{
  "agent": {
    "agent_2": {
      "mode": "subagent",
      "model": "opencode/gpt-5-nano",
      "temperature": 0.3
    }
  }
}
```
- **Model**: `opencode/gpt-5-nano` (for backend consistency)
- **Temperature**: `0.3` (lower for code consistency)
- **Tools**: All tools enabled

**Important**: When a task is delegated to a sub-agent, it executes with **ALL** the agent's configured parameters (model, temperature, tools), not the orchestrator's configuration.

## How to Run Examples

### Running the Orchestrator

From the examples directory, run:

```bash
cd examples/orchestrator
opencode run "$(cat prompt_agent_1.txt)"
```

Or with an inline prompt:

```bash
cd examples/orchestrator
opencode run "Delegate this task to most suitable agent. Task: create modern looking landing page index.html advertizing a generic mobile game"
```

### Example Prompts

#### Prompt 1: Frontend Task (delegates to @agent_1)
`prompt_agent_1.txt`
```
Delegate this task to most suitable agent. Task: create modern looking landing page index.html advertizing a generic mobile game.
```

**Expected behavior**: Orchestrator delegates to `agent_1`, which:
- Uses model `opencode/gpt-5-nano` (configured in agent_1/opencode.json)
- Has temperature `0.8` (configured in agent_1/opencode.json)
- Works in `agent_1` directory
- Creates landing page using all tools

**Verify**: Check console logs for `[orchestrator_delegate] modelStr=opencode/gpt-5-nano`

#### Prompt 2: Backend Task (delegates to @agent_2)
`prompt_agent_2.txt`
```
Delegate this task to most suitable agent. Task: create a simple REST API with Express.js that has /api/users endpoint with GET/POST methods, use in-memory array for storage
```

**Expected behavior**: Orchestrator delegates to `agent_2`, which:
- Uses model `opencode/gpt-5-nano` (configured in agent_2/opencode.json)
- Has temperature `0.3` (configured in agent_2/opencode.json)
- Works in `agent_2` directory
- Creates backend API using all tools

**Verify**: Check console logs for `[orchestrator_delegate] modelStr=opencode/gpt-5-nano`

#### Prompt 3: Multiple Tasks (parallel delegation)
`prompt_multi_tasks.txt`

```
I need two things done: 1) Create a landing page for a mobile game in index.html 2) Create a simple Express.js REST API with /api/users endpoint. Delegate each to the most suitable agent.
```

**Expected behavior**: Orchestrator delegates to both `agent_1` and `agent_2` in parallel, each working in their own sub-session.

## Watching Sub-Agent Sessions

To observe work being spawned in individual sessions, use:

```bash
watch -d opencode session list -n 10
```
You should see:
- The main orchestrator session
- Child sessions for each delegated agent (e.g., "agent_1 - create modern looking...")

### Verify Agent Configuration is Applied

**Watch the console logs** when delegating to see the exact configuration being applied. Look for this pattern in the logs:

```
[orchestrator_delegate] agent=agent_1 agentPath=/path/to/agent_1
[orchestrator_delegate] modelStr=opencode/gpt-5-nano modelOverride={"providerID":"opencode","modelID":"gpt-5-nano"}
[orchestrator_delegate] toolsOverride={"read":true,"write":true,...}
```

**What to look for:**
- ✅ **modelStr**: Shows which model is configured (e.g., `opencode/gpt-5-nano` for agent_1, `opencode/big-pickle` for agent_2)
- ✅ **modelOverride**: Shows the parsed model in providerID/modelID format
- ✅ **toolsOverride**: Shows which tools are enabled

**Verify in session output**: The sub-agent should report using its configured model.

### Check Specific Agent Session Status

```bash
opencode session messages <session-id>
```

Or use the orchestrator tools:
- `orchestrator_status taskId="<session-id>"` - Check task status
- `orchestrator_tasks` - List all delegated tasks

## How It Works

1. **Orchestrator** receives a task and uses `orchestrator_delegate` tool
2. Plugin creates a **child session** for the sub-agent
3. Sub-agent's `AGENT.md` is injected as context via the `agent` parameter
4. Sub-agent's configuration is **fully applied**:
   - **Model**: Custom model from opencode.json (e.g., `opencode/gpt-5-nano`)
   - **Temperature**: Custom temperature from opencode.json
   - **Tools**: Custom tool permissions from opencode.json
   - **Working directory**: Set to the sub-agent's directory
5. Task is executed with the sub-agent's specific parameters
6. Main session can monitor via `orchestrator_status` or `orchestrator_read_output`

### Available Orchestrator Tools

| Tool | Description |
|------|-------------|
| `orchestrator_delegate` | Delegate task to a sub-agent |
| `orchestrator_list_agents` | List available sub-agents |
| `orchestrator_status` | Check delegated task status |
| `orchestrator_tasks` | List all delegated tasks |
| `orchestrator_cancel` | Cancel a delegated task |

## Troubleshooting

- **Plugin not found**: Ensure the plugin is properly built (`bun run build` in the orchestration project)
- **Permission errors**: Check that `opencode.json` has proper permissions for agent directories
- **Sessions not appearing**: Ensure you're running the server in a way that supports child sessions
- **Agent using wrong config**: Check console logs for `[orchestrator_delegate]` messages to verify the correct model and tools are being passed

### Debugging Tips

1. **Check plugin logs**: Look for `[orchestrator_delegate]` messages to see which agent config is being loaded
2. **Verify model being used**: The sub-agent session should execute using the model specified in its opencode.json (not the orchestrator's model)
3. **Check session messages**: Use `orchestrator_read_output` to see the conversation and verify the agent is responding correctly
