# Contributing to opencode-session-agents

Contributions are welcome! Please follow these guidelines.

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Build
bun run build
```

## Release Process

Use the release scripts to publish:

```bash
# Patch release (bug fixes)
bun run release:patch

# Minor release (new features)
bun run release:minor

# Major release (breaking changes)
bun run release:major
```

This will:
1. Bump the version in package.json
2. Create a git tag
3. Push to remote
4. Publish to npm

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run typecheck and build
5. Submit a pull request
