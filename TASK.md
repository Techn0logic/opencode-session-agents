I am using opencode|
 
setup
 
orchestrator/
    AGENT.md, opencode.json
agent_1
    AGENT.md, opencode.json
agent_2
    AGENT.md, opencode.json
 
I want session in ./orchestrator to be able to spawn non-blocking specialized tasks in agent_1, agent_2 non-blocking sessions
 
How to achieve that?Yes, you can do exactly this with OpenCode's built-in multi-agent system. The orchestrator session acts as the "brain" and spawns non-blocking child sessions for agent_1 and agent_2 (or any number of specialized agents) using the Task tool. These child sessions run independently in parallel — the orchestrator doesn't wait or block.
1. Recommended Project Structure (minimal changes)
Keep your current folders, but make the agents discoverable:
text.
├── orchestrator/
│   ├── AGENT.md          ← your orchestrator (primary)
│   ├── opencode.json     ← configure task permissions here
│   └── .opencode/agents/ ← ←← NEW: copy/link agent defs here
│       ├── agent_1.md
│       └── agent_2.md
├── agent_1/
│   ├── AGENT.md
│   └── opencode.json
└── agent_2/
    ├── AGENT.md
    └── opencode.json
Copy the frontmatter + content from agent_1/AGENT.md into orchestrator/.opencode/agents/agent_1.md (same for agent_2).
OpenCode automatically loads markdown agents from .opencode/agents/ (project-local) or ~/.config/opencode/agents/ (global).
2. Configure the Orchestrator (orchestrator/opencode.json or AGENT.md frontmatter)
Make it a pure router that can only delegate:
JSON// orchestrator/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",   // or your fast router model
      "temperature": 0.1,
      "tools": {
        "task": true,
        "read": true,
        "list": true,
        "grep": true,
        // disable everything else so it NEVER executes
        "write": false,
        "edit": false,
        "bash": false
      },
      "task": {
        "*": "deny",           // security: only allow known agents
        "agent_1": "auto",
        "agent_2": "auto"
      }
    }
  },
  "default_agent": "orchestrator"
}
Or in orchestrator/AGENT.md frontmatter (same keys):
Markdown---
mode: primary
model: ...
tools:
  task: true
  read: true
  # ...
task:
  "*": "deny"
  "agent_1": "auto"
  "agent_2": "auto"
---
3. Make agent_1 & agent_2 subagents
In orchestrator/.opencode/agents/agent_1.md (and agent_2.md):
Markdown---
description: Specialized agent for [whatever it does]
mode: subagent          ←←← critical
model: ...
temperature: ...
tools: { ... }          ← whatever this agent needs
---
[rest of your original agent prompt]
4. How to spawn non-blocking tasks from the orchestrator session
Start a session in ./orchestrator (it will use the orchestrator agent by default).
The orchestrator LLM will automatically (or you can force it) output multiple task tool calls in one single response → they launch in parallel, non-blocking.
Example of what the orchestrator will output:
Markdown### Routing Decision
- Agents: @agent_1 and @agent_2 (parallel)

### Delegation
<tool_call>
  <tool>task</tool>
  <subagent_type>agent_1</subagent_type>
  <prompt>Full self-contained prompt with all context needed for agent_1...</prompt>
</tool_call>

<tool_call>
  <tool>task</tool>
  <subagent_type>agent_2</subagent_type>
  <prompt>Full self-contained prompt with all context needed for agent_2...</prompt>
</tool_call>
Each call creates its own child session that runs independently.
5. Navigate the non-blocking sessions

Ctrl+Right / session_child_cycle → next child session
Ctrl+Left / session_child_cycle_reverse → previous
You can jump between orchestrator and all spawned agents at any time.
Results appear in their respective sessions; the orchestrator can later call more tasks to synthesize if needed.

Bonus: Even better parallelism (optional)
If you want advanced work-stealing queues, session pooling, or automatic coordination, install the popular orchestrator plugins:
Bash# Example popular ones
opencode install opencode-orchestrator
# or
opencode install oh-my-opencode
They extend the same task mechanism with better parallel handling and plugins.
That’s it — your orchestrator session now spawns true non-blocking specialized sessions for agent_1 and agent_2 (and any others you add). Just start the session in ./orchestrator and let it route.
Let me know if you want a full ready-to-copy AGENT.md template for the orchestrator!