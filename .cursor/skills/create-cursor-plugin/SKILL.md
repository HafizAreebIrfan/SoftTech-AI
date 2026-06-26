---
name: create-cursor-plugin
description: >-
  Scaffolds Cursor plugins from MCP servers. Use when the user wants to create a
  Cursor plugin, package an MCP server for Cursor Marketplace, add mcp.json to
  a plugin, generate plugin.json manifest, or turn CompanyMcpMetadata into
  distributable plugin components (skills, rules, MCP config).
---

# Create Cursor Plugin

Turn an MCP server into a distributable Cursor plugin.

## Quick decision

| Server transport | `mcp.json` shape |
|------------------|------------------|
| HTTP / Streamable HTTP (this repo) | `{ "url": "https://host/mcp/..." }` |
| stdio (local process) | `{ "command": "node", "args": ["dist/server.js"], "type": "stdio" }` |

## Plugin layout

```
cursor-plugin/
├── .cursor-plugin/
│   └── plugin.json          # required manifest (name is required)
├── mcp.json                 # auto-discovered MCP servers
├── skills/
│   └── my-assistant/
│       └── SKILL.md
├── rules/
│   └── my-mcp.mdc
├── agents/                  # optional
├── commands/                # optional
└── hooks/
    └── hooks.json           # optional
```

Reference implementation in this repo: [`cursor-plugin/`](../../cursor-plugin/).

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Gather MCP server metadata
- [ ] Step 2: Scaffold plugin directory
- [ ] Step 3: Write plugin.json + mcp.json
- [ ] Step 4: Generate skill + rule from server instructions
- [ ] Step 5: Validate locally
- [ ] Step 6: (Optional) Submit to Cursor Marketplace
```

### Step 1: Gather metadata

Collect from the MCP server codebase:

- **Plugin name** — lowercase kebab-case (e.g. `weatherwayapp`)
- **Server URL or stdio command**
- **Server instructions** — text the agent should follow (see `ServerInstructions/` or MCP `instructions` field)
- **Tools** — name, description, input/output fields
- **Intents / keywords** — what user questions should trigger the plugin
- **Auth** — headers, env vars, OAuth (use `${env:VAR}` in mcp.json)

In this repo, structured metadata lives in `src/infrastructure/mcp/metadata/**` as `CompanyMcpMetadata`.

### Step 2: Scaffold

Run the scaffold script from the repo root:

```bash
node .cursor/skills/create-cursor-plugin/scripts/scaffold-plugin.mjs \
  --name my-plugin \
  --output cursor-plugin-my \
  --url "https://example.com/mcp/endpoint" \
  --instructions "Agent instructions here." \
  --tools '[{"name":"get_data","description":"Returns data."}]'
```

Or copy templates from [templates/](templates/) and replace placeholders manually.

### Step 3: plugin.json

Minimum manifest:

```json
{
  "name": "my-plugin",
  "description": "One-line purpose",
  "version": "1.0.0",
  "author": { "name": "Your Team" },
  "keywords": ["mcp"]
}
```

Optional manifest fields: `rules`, `skills`, `mcpServers`, `hooks`, `commands`, `agents` — only needed for non-default paths.

### Step 4: mcp.json

HTTP server (matches this project's `/mcp/weathermcp` endpoint):

```json
{
  "mcpServers": {
    "my-server": {
      "url": "${env:MY_MCP_URL}",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

Set env before using the plugin:

```bash
export YOUR_MCP_URL="https://yourdomain/mcp/yourmcpserver"
```

stdio server:

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcp-server.js"],
      "env": {
        "API_KEY": "${env:MY_API_KEY}"
      }
    }
  }
}
```

### Step 5: Skill from server metadata

Derive the skill description from `intents.keywords`, `intents.supported`, and `recommendationHints`.

Template: [templates/skill-SKILL.md](templates/skill-SKILL.md)

- Map each tool to a row in a "Tools" table
- Copy server instructions as behavioral rules
- Include `examplePrompts` from metadata

### Step 6: Rule (optional)

Add a short `.mdc` rule when the agent should prefer MCP tools over guessing. Template: [templates/rule.mdc](templates/rule.mdc).

### Step 7: OpenAI App SDK / ext-apps notes

Servers using `@modelcontextprotocol/ext-apps`:

- Tools registered with `registerAppTool` may include `_meta.ui.resourceUri` for MCP Apps widgets
- Resources registered with `registerAppResource` serve HTML UI (`RESOURCE_MIME_TYPE`)
- Cursor supports MCP Apps; the plugin skill/rule should tell the agent to call tools (UI renders when the client supports it)
- Widget HTML is built separately (e.g. Vite → `dist/weather-card.html`) and inlined at runtime on the server — the plugin only needs the HTTP MCP URL

### Step 8: Local validation

1. Set required env vars (`WEATHERWAY_MCP_URL`, API keys on the server side)
2. Register the plugin path in Cursor:
   - Install from the `cursor-plugin/` folder, or
   - Use Extension API: `vscode.cursor.plugins.registerPath("/path/to/cursor-plugin")`
3. Open Cursor Settings → MCP and confirm the server connects
4. Ask a trigger prompt from the skill's examples

### Step 9: Marketplace submission (optional)

- Valid `.cursor-plugin/plugin.json` with unique kebab-case `name`
- Public Git repository
- Submit at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)
- Multi-plugin repos: add `.cursor-plugin/marketplace.json`

## Mapping CompanyMcpMetadata → plugin

| Metadata field | Plugin artifact |
|----------------|-----------------|
| `companyId` / `serverName` | `plugin.json` name & description |
| `summary`, `recommendationHints` | skill intro + description YAML |
| `intents.keywords`, `intents.examplePrompts` | skill description triggers + examples |
| `tools[]` | skill tools table |
| `tools[].description` | MCP tool docs in skill |
| Server instructions string | skill rules + rule file |
| Deployed MCP URL | `mcp.json` `url` |

## Additional resources

- Full field reference: [reference.md](reference.md)
- File templates: [templates/](templates/)
