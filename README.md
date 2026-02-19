# OpenCode Multi-Agent Orchestration Demo

A demonstration of OpenCode's multi-agent system showing how to build an orchestrator pattern with specialized subagents for parallel, non-blocking task execution.

## Overview

This project showcases OpenCode's built-in multi-agent capabilities with a router-orchestrator pattern:

- **Orchestrator**: A pure delegation router that spawns non-blocking child sessions
- **Agent 1**: Specialized in frontend development tasks
- **Agent 2**: Specialized in backend development tasks

The orchestrator session can spawn multiple specialized tasks in parallel that run independently, without blocking the main orchestrator session.

## Project Structure

```
opencode-orchestration/
├── orchestrator/
│   ├── AGENT.md           # Orchestrator agent definition
│   └── opencode.json      # Orchestrator configuration
├── agent_1/
│   ├── AGENT.md           # Frontend specialist agent
│   └── opencode.json      # Agent 1 configuration
├── agent_2/
│   ├── AGENT.md           # Backend specialist agent
│   └── opencode.json      # Agent 2 configuration
└── README.md              # This file
```

## How It Works

### Orchestrator Pattern

The orchestrator agent (`orchestrator/AGENT.md`) is configured as a pure router with strict permissions:

- ✅ Can delegate tasks using `asyncagents_task`
- ✅ Can list and read agent definitions
- ❌ Cannot write files, edit files, or run bash commands
- 🔒 Delegates all actual work to subagents

### Subagent Specialization

**Agent 1** (Frontend Specialist):
- Handles React, Vue, HTML, CSS, and other frontend tasks
- Creates and modifies UI components
- Writes and runs frontend tests

**Agent 2** (Backend Specialist):
- Handles API design, database, and server logic
- Creates and modifies server-side components
- Designs and optimizes database schemas

### Non-Blocking Task Execution

When the orchestrator receives a task:

1. It lists available agents in the root directory
2. Reads each agent's definition to determine capabilities
3. Spawns non-blocking tasks using `asyncagents_task`
4. Responds immediately to the user
5. Subagents work in parallel in their own sessions

### Session Navigation

Jump between sessions using:
- `Ctrl+Right` / `session_child_cycle` → next child session
- `Ctrl+Left` / `session_child_cycle_reverse` → previous session

## Getting Started

### Prerequisites

- [OpenCode CLI](https://opencode.ai) installed
- Access to the OpenCode service

### Usage

1. **Start the orchestrator session**:
   ```bash
   cd orchestrator
   opencode
   ```

2. **Send a task to the orchestrator**:
   ```
   Create a button component
   ```

3. **The orchestrator will automatically**:
   - Discover available agents
   - Delegate to the appropriate subagent
   - Respond immediately that the task was delegated

4. **Navigate to the subagent session**:
   - Use `Ctrl+Right` to switch to the child session
   - View the subagent working on the task

5. **Check task status** (from orchestrator):
   ```
   List all running tasks
   ```

## Configuration

### Orchestrator Permissions

The orchestrator is configured with restricted permissions to enforce the router pattern:

```json
{
  "tools": {
    "asyncagents_task": true,
    "asyncagents_list": true,
    "asyncagents_output": true,
    "asyncagents_cancel": true,
    "list": true,
    "read": true,
    "write": false,
    "edit": false,
    "bash": false
  },
  "task": {
    "*": "deny",
    "agent_1": "auto",
    "agent_2": "auto"
  }
}
```

### Adding New Agents

To add a new specialized agent:

1. Create a new directory (e.g., `agent_3/`)
2. Add `AGENT.md` with mode: `subagent`
3. Add `opencode.json` with agent configuration
4. Add the agent to the orchestrator's task permissions:
   ```json
   "task": {
     "*": "deny",
     "agent_1": "auto",
     "agent_2": "auto",
     "agent_3": "auto"
   }
   ```

## Key Features

- **Parallel Execution**: Multiple subagents can work simultaneously
- **Non-Blocking**: Orchestrator remains responsive while subagents work
- **Specialization**: Each agent focuses on specific domains
- **Fire-and-Forget**: Delegate tasks and continue working
- **Task Management**: List, monitor, and cancel running tasks
- **Session Navigation**: Easy switching between orchestrator and subagents

## Advanced Usage

### Better Async Agents Plugin

This project uses the `better-opencode-async-agents` plugin for enhanced async agent capabilities. Install with:

```bash
opencode install better-opencode-async-agents
```

### Other Orchestrator Plugins

For advanced features like work-stealing queues, session pooling, or automatic coordination, consider:

```bash
opencode install opencode-orchestrator
# or
opencode install oh-my-opencode
```

## License

This is a demonstration project for OpenCode's multi-agent system.

## Resources

- [OpenCode Documentation](https://opencode.ai)
- [OpenCode GitHub Issues](https://github.com/anomalyco/opencode/issues)
