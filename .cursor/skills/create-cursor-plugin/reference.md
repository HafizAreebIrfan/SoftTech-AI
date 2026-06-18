# Cursor Plugin Reference

## Manifest (`plugin.json`)

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Lowercase kebab-case, unique |
| `description` | recommended | Shown in marketplace |
| `version` | recommended | Semver |
| `author.name` | recommended | |
| `keywords` | optional | Discovery tags |
| `mcpServers` | optional | Override default `mcp.json` path or inline config |
| `skills` | optional | Custom path(s) to skill directories |
| `rules` | optional | Custom path(s) to rule files |
| `hooks` | optional | Path to hooks.json or inline config |

Components in default folders are auto-discovered without manifest entries.

## mcp.json interpolation

Variables work in `command`, `args`, `env`, `url`, `headers`:

| Variable | Resolves to |
|----------|-------------|
| `${env:NAME}` | Environment variable |
| `${userHome}` | User home directory |
| `${workspaceFolder}` | Project root |

## Plugin vs project MCP

| Location | Scope |
|----------|-------|
| Plugin `mcp.json` | Bundled with plugin install |
| `.cursor/mcp.json` | Project-only |
| `~/.cursor/mcp.json` | Global user config |

Plugins are the distributable packaging layer; project MCP is for local dev overrides.

## ext-apps server checklist

When the MCP server uses `@modelcontextprotocol/ext-apps`:

- [ ] HTTP transport exposes Streamable HTTP endpoint (this repo: `POST /mcp/weathermcp`)
- [ ] Tools use `registerAppTool` with `inputSchema` / `outputSchema` (Zod → JSON Schema)
- [ ] UI tools set `_meta.ui.resourceUri`
- [ ] Widget HTML built to `dist/` and inlined in `registerAppResource`
- [ ] Server `instructions` string matches plugin skill behavioral rules
- [ ] Plugin `mcp.json` points at deployed URL (not localhost) for end users

## Extension API (programmatic install)

```typescript
vscode.cursor.plugins.registerPath("/absolute/path/to/cursor-plugin");
vscode.cursor.mcp.registerServer({ name: "my-server", config: { url: "..." } });
```

Use for enterprise or automated onboarding without manual `mcp.json` edits.

## Marketplace requirements

- Public Git repo
- Valid manifest with `name`, `description`, `version`, `author`
- No secrets in committed files — use `${env:...}` for URLs/tokens
- Manually reviewed before listing
