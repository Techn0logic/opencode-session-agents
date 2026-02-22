# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-02-22

### Changed
- `detectAgentRoot()` now returns the parent directory of the current working directory (one level only)
- Agent discovery is constrained to the parent directory only - no traversal beyond that level
- `orchestrator_list_agents` description updated to reflect parent directory discovery

### Behavior Change
- Running orchestrator from a subdirectory (e.g., `examples/orchestrator/`) discovers agents in the parent directory (`examples/`)
- Agents outside the parent directory (e.g., in project root or higher levels) are no longer discovered
- This provides consistent and predictable agent discovery scope

### Examples Compatibility
- The `examples/` directory structure continues to work as expected
- Run from `examples/orchestrator/` to discover `agent_1` and `agent_2` in the parent `examples/` directory

## [1.0.0] - 2025-02-20

### Added
- Initial release
- `orchestrator_list_agents` - List available sub-agents
- `orchestrator_delegate` - Delegate tasks to sub-agents
- `orchestrator_status` - Monitor delegated session status
- `orchestrator_read_output` - Read messages from delegated sessions
- Auto-discovery of agent directories (AGENT.md or opencode.json)
- TypeScript support with full type definitions
