# opencode-session-agents

[![npm version](https://img.shields.io/npm/v/opencode-session-agents)](https://www.npmjs.com/package/opencode-session-agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Multi-agent orchestration plugin for OpenCode - enables spawning sub-agents with their own sessions, AGENT.md specs, and opencode.json configurations. Allows delegating to agents with their own configuration outside of the OpenCode project global.

## Features

- **Spawn Sub-Agents**: Create isolated child sessions for each sub-agent
- **Custom Agent Config**: Each sub-agent can have its own AGENT.md and opencode.json
- **Session Management**: Monitor status and read output from delegated sessions
- **Parallel Execution**: Delegate tasks without blocking the main session
- **Auto-Discovery**: Automatically detects agent directories in your project

## Note 
⚠️ Third-Party Plugin
This plugin is an independent community project and is not affiliated with, maintained by, or officially supported by the *OpenCode* team.

## Installation

### From npm

```bash
opencode install opencode-session-agents
```

Then add to your `opencode.json`:

```json
{
  "plugin": ["opencode-session-agents"]
}
```

### From Source (Local Development)

```json
{
  "plugin": ["file:///path/to/opencode-session-agents"]
}
```

## Tested Versions

- **OpenCode**: Latest stable (v1.2.10)
- **Plugin**: opencode-session-agents v1.0.1

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
│   User Prompt                                                                   │
│         │                                                                       │
│         ▼                                                                       │
│ ┌───────────────────┐                                                           │
│ │   ORCHESTRATOR    │  • Receives high-level task                               │
│ │   (Main Session)  │  • Analyzes task requirements                             │
│ │                   │  • Delegates to suitable sub-agent                        │
│ └─────────┬─────────┘                                                           │
│           │                                                                     │
│           │ orchestrator_delegate                                               │
│           │                                                                     │
│           ▼                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │ 
│ │                      PLUGIN: SPAWN SUB-AGENT                                │ │
│ │  1. Create dedicated CHILD SESSION for sub-agent                            │ │
│ │  2. Inject sub-agent's AGENT.md as context                                  │ │
│ │  3. Apply sub-agent's opencode.json (model, tools, permissions)             │ │
│ │  4. Execute task in sub-agent's dedicated working directory                 │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│           │                                                                     │
│           ▼                                                                     │
│ ┌───────────────────┐    ┌───────────────────┐                                  │
│ │      AGENT_1      │    │      AGENT_2      │                                  │
│ │  (Child Session)  │    │  (Child Session)  │                                  │
│ │                   │    │                   │                                  │
│ │ Working Dir:      │    │ Working Dir:      │                                  │
│ │  agent_1/         │    │  agent_2/         │                                  │
│ │                   │    │                   │                                  │
│ │ Model: (custom)   │    │ Model: (custom)   │                                  │
│ │ Tools: (custom)   │    │ Tools: (custom)   │                                  │
│ └─────────┬─────────┘    └─────────┬─────────┘                                  │
│           │                        │                                            │
│           ▼                        ▼                                            │
│     [Parallel Execution in Dedicated Sessions]                                  │
│           │                        │                                            │
│           ▼                        ▼                                            │   
│     Results available via orchestrator_status                                   │
│           │                                                                     │
│           ▼                                                                     │
│     Main session can monitor or read output                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Expected Behavior

- **Delegation Flow**: The orchestrator analyzes incoming tasks and uses `orchestrator_delegate` to spawn a child session for the most suitable sub-agent
- **Dedicated Sessions**: Each sub-agent runs in its own isolated session - parallel execution is supported
- **Individual Sub-Agent Config**: Each delegated task inherits the sub-agent's `opencode.json` (custom model, tool permissions, etc.) and operates in the sub-agent's working directory
- **Context Injection**: The sub-agent's `AGENT.md` is automatically injected as initial context, defining the agent's role and capabilities
- **Non-Blocking**: Delegation is non-blocking - the main session remains responsive while sub-agents work in parallel

### What Happens When You Delegate

1. **Discovery**: Scans project for directories with AGENT.md or opencode.json
2. **Delegation**: Creates a new child session for the sub-agent
3. **Context Injection**: Injects the agent's AGENT.md as initial context
4. **Config Application**: Applies sub-agent's opencode.json (custom model, tools, permissions)
5. **Execution**: Sends the task prompt to the child session
6. **Monitoring**: Returns session ID for status/output checking

The orchestrator remains responsive while sub-agents work in parallel.

## Example
```
┌───────────────────────────────────────────────────────
│opencode-session-agents/examples/orchestrator
└─> opencode run "$(cat prompt_agent_1.txt)"

> orchestrator · big-pickle

⚙ orchestrator_list_agents Unknown
→ Read ../agent_1/AGENT.md
→ Read ../agent_2/AGENT.md

Agent 1 is clearly the most suitable - it's a specialized frontend development assistant that handles HTML, CSS, Tailwind, and creates modern landing pages. Let me delegate the task.

[orchestrator_delegate] agent=agent_1 agentPath=/home/johnny/Projects/opencode-session-agents/examples/agent_1
[orchestrator_delegate] modelStr=opencode/gpt-5-nano modelOverride={"providerID":"opencode","modelID":"gpt-5-nano"}
[orchestrator_delegate] toolsOverride={"read":true,"grep":true,"glob":true,"write":true,"edit":true,"bash":true}
⚙ orchestrator_delegate {"agent":"agent_1","task":"Create a modern looking landing page index.html advertising a generic mobile game. Use Tailwind CDN, glassmorphism, gradients, animations, and a dark game aesthetic with vibrant neon accents. Make it fully responsive with phone mockups and floating/hover animations."}

Delegated to **agent_1** (frontend specialist) - it's executing in its directory. Let me check on progress:

⚙ orchestrator_status {"sessionId":"ses_37ef6ffdcfferrprrOJqsbALwU"}
⚙ orchestrator_read_output {"lastN":5,"sessionId":"ses_37ef6ffdcfferrprrOJqsbALwU"}
⚙ orchestrator_status {"sessionId":"ses_37ef6ffdcfferrprrOJqsbALwU"}
→ Read ../agent_1/index.html

Done! **agent_1** (frontend specialist) created a modern landing page at `/home/johnny/Projects/opencode-session-agents/examples/agent_1/index.html`.

The page features:
- Dark space theme with cyan/teal neon accents
- Glassmorphism header with sticky navigation
- Hero section with gradient background and SVG planet art
- App Store & Google Play download buttons
- Features section with 4 cards
- Screenshot gallery (placeholder blocks)
- Fully responsive (mobile/tablet/desktop)

The file is self-contained with no external dependencies (uses inline CSS).
```

## Quick Start

1. **Create Agent Directories**: Add sub-agent folders with AGENT.md files

```
my-project/
├── agent_frontend/
│   ├── AGENT.md        # Agent role and capabilities
│   └── opencode.json   # (optional) agent-specific config
├── agent_backend/
│   ├── AGENT.md
│   └── opencode.json
└── opencode.json
```

2. **Agent AGENT.md Example**:

```markdown
---
mode: subagent
---

# Frontend Specialist

You are a frontend development expert. You specialize in:
- React, Vue, and modern JavaScript frameworks
- CSS, Tailwind, and styling solutions
- Component architecture and design systems
```

3. **Delegate Tasks**: Use the orchestrator tools to delegate work

```
Create a login form component in React with validation
```

## Tools Reference

### orchestrator_list_agents

List all available sub-agents in the project.

**Arguments**: None

**Returns**: Array of agent objects with name, path, description, and model

```json
[
  {
    "name": "agent_frontend",
    "path": "/path/to/project/agent_frontend",
    "description": "Frontend specialist agent",
    "model": "anthropic/claude-sonnet-4-20250514"
  }
]
```

### orchestrator_delegate

Delegate a task to a sub-agent. Creates a child session and executes the task.

**Arguments**:
- `agent` (string, required): Sub-agent directory name
- `task` (string, required): Task prompt to execute

**Returns**: Session info with status

```json
{
  "sessionId": "sess_abc123",
  "agent": "agent_frontend",
  "directory": "/path/to/project/agent_frontend",
  "status": "delegated",
  "note": "Task is executing in background..."
}
```

### orchestrator_status

Get the status of a delegated child session.

**Arguments**:
- `sessionId` (string, required): Child session ID from delegation

**Returns**: Session status and message count

```json
{
  "id": "sess_abc123",
  "title": "agent_frontend - Create login form...",
  "status": "running",
  "messageCount": 5,
  "lastMessage": { ... }
}
```

### orchestrator_read_output

Read the last N messages from a child session.

**Arguments**:
- `sessionId` (string, required): Child session ID
- `lastN` (number, optional): Number of messages (1-50, default: 10)

**Returns**: Array of messages with role and content

## Agent Discovery

The orchestrator discovers agents in the parent directory of the current working directory (one level up only). No agents outside that parent directory will be discovered or accessible.

**Example Structure**:
```
examples/
├── orchestrator/     <- Run from here
├── agent_1/          <- Discoverable (in parent)
└── agent_2/          <- Discoverable (in parent)
```

**Usage**:
```bash
# Run from examples/orchestrator/ to discover agents in examples/
cd examples/orchestrator/
opencode run "list available agents"
# Result: Lists agent_1, agent_2, orchestrator (if it has opencode.json)

# Agents outside examples/ are NOT discoverable
# No agents in /home/user/ or project root are accessible
```

**Note**: This limits discovery and delegation to agents within the immediate parent directory of CWD.

## Configuration

### Agent Directory Structure

Each sub-agent directory can contain:

- `AGENT.md` (required): Agent role definition with `mode: subagent`
- `opencode.json` (optional): Agent-specific configuration

```
agent_example/
├── AGENT.md         # Required: agent role/spec
└── opencode.json    # Optional: model, permissions, etc.
```

### opencode.json Agent Config

```json
{
  "description": "Frontend specialist",
  "model": "opencode/big-pickle",
  "tools": {
    "write": true,
    "edit": true,
    "bash": true
  }
}
```

### Permissions

The orchestrator typically needs read permissions to discover and delegate:

```json
{
  "tools": {
    "orchestrator_list_agents": true,
    "orchestrator_delegate": true,
    "orchestrator_status": true,
    "orchestrator_read_output": true,
    "read": true
  }
}
```

## Known Limitations

- **Permissions Not Fully Applied**: Only `model` and `tools` from sub-agent's `opencode.json` are applied via the session prompt. Session-level permissions (edit, bash, webfetch) from the `permission` field are not currently enforced and must be granted in the parent session's configuration.

  **Reference**: [GitHub Issue #6396](https://github.com/anomalyco/opencode/issues/6396) - Discusses how session-specific directories and configs work.

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Build
bun run build
```

## License

MIT
