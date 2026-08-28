# OpenAI Plugin & Skills Architecture Blueprint

---

## Executive Summary

OpenAI has unified ChatGPT and Codex into a **Universal Plugin Specification**. Under this standard:
- **Plugins** are the top-level packages users discover, install, and manage in ChatGPT and Codex.
- **Skills** provide deterministic workflow guidance (`SKILL.md`) teaching the AI *when* and *how* to use tools.
- **MCP Servers** provide the authoritative backend capabilities (tools, data, authentication).
- **ChatGPT UI (MCP Apps)** provides interactive visual components rendered in sandboxed iframes over a bidirectional JSON-RPC bridge (`postMessage`).

For **SoftTech AI**, adopting and supporting this standard transforms our platform into an **all-in-one AI Plugin & MCP Generator** for businesses, allowing any company to export a 100% OpenAI-compliant plugin ready for private testing, enterprise workspace distribution, or public directory submission.

---

## 1. Official OpenAI Plugin Package Architecture

An official OpenAI plugin is structured into a clean, modular folder hierarchy:

```text
my-company-plugin/
├── .codex-plugin/
│   └── plugin.json             # [REQUIRED] Main plugin manifest & identity
├── skills/                     # [SKILLS] Bundled repeatable workflows
│   ├── manage-packages/
│   │   ├── SKILL.md            # Workflow instructions & triggers
│   │   └── references/         # Supporting schemas, policies, guides
│   └── customer-support/
│       └── SKILL.md
├── .app.json                   # Remote registered MCP server connector mapping
├── .mcp.json                   # Bundled/local MCP server execution config (optional)
├── hooks/                      # Lifecycle hooks (e.g. SessionStart)
│   └── hooks.json
├── assets/                     # Visual presentation & branding
│   ├── logo.png                # Plugin directory square logo
│   ├── icon.png                # Composer action icon
│   └── screenshot-1.png        # Directory preview screenshot
└── web/                        # Built UI component bundle (MCP App resource)
    └── dist/
        └── widget.js
```

---

## 2. Core Pillars of the OpenAI Specification

### Pillar A: The Plugin Manifest (`.codex-plugin/plugin.json`)

The manifest identifies the plugin, declares its components, and specifies how ChatGPT/Codex surfaces it to users:

```json
{
  "name": "cardetailerzz",
  "version": "1.0.0",
  "description": "Book detailing packages, track orders, and manage services for Car Detailerzz.",
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "hooks": "./hooks/hooks.json",
  "interface": {
    "displayName": "Car Detailerzz",
    "shortDescription": "Car detailing booking and package management",
    "longDescription": "Explore vehicle detailing packages, book appointments, check live order statuses, and manage automotive care services directly in ChatGPT.",
    "developerName": "SoftTech AI",
    "category": "Productivity",
    "capabilities": ["Interactive", "Read", "Write"],
    "websiteURL": "https://cardetailerzz.com",
    "privacyPolicyURL": "https://cardetailerzz.com/privacy",
    "termsOfServiceURL": "https://cardetailerzz.com/terms",
    "defaultPrompt": [
      "@CarDetailerzz Show me available packages for my sedan",
      "@CarDetailerzz Check my order status"
    ],
    "brandColor": "#475569",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": ["./assets/screenshot-1.png"]
  }
}
```

---

### Pillar B: The Skills System (`SKILL.md`)

A Skill is the **workflow intelligence layer**. While MCP tools expose raw API endpoints, the Skill teaches the model:
1. **Trigger conditions**: When should the model activate this workflow?
2. **Step sequencing**: What sequence of tools should be called?
3. **Safety & decision boundaries**: What facts must *never* be invented? When to ask follow-up questions?

#### Example: `skills/booking-packages/SKILL.md`

```markdown
---
name: booking-packages
description: Guide customers in selecting and booking vehicle detailing packages based on car type and service needs.
---

Use this skill when the user asks about car detailing packages, pricing, or wants to book a service.

### Workflow:
1. Inspect the user's request for their vehicle type (e.g. sedan, SUV, truck) and requested service.
2. Call `get_packages` to fetch active packages and pricing tiers.
3. If the user has a specific vehicle type, highlight the suitable packages and tiered options.
4. Present the interactive package catalog to the customer.
5. If the user decides to book, prompt for date/time preferences and call `create_booking`.

### Constraints:
- Never assume vehicle size if ambiguous; ask the user before finalizing a package tier.
- Do not display pending or draft packages to customer audiences.
```

---

### Pillar C: Decoupled Data & Render Tools

OpenAI emphasizes **decoupling data-fetching tools from UI-rendering tools** to prevent excessive re-renders and let the model reason before presenting:

```text
User Request
     │
     ▼
[Data Tool: get_packages] ──► Returns structured JSON data to ChatGPT
     │
     ▼ (ChatGPT filters / reasons)
[Render Tool: render_package_catalog] ──► Attaches _meta.ui.resourceUri
     │
     ▼
[Iframe Widget Mounts] ──► Renders interactive catalog once with verified data
```

---

### Pillar D: ChatGPT UI & MCP Apps Standard

Interactive widgets communicate with the host via standard JSON-RPC over `postMessage`:

| Action | Standard MCP Apps Method | ChatGPT Extension Alias |
|---|---|---|
| Receive Tool Data | `ui/notifications/tool-result` | `window.openai.toolOutput` |
| Call Tool from UI | `tools/call` | `window.openai.callTool` |
| Send Chat Follow-up | `ui/message` | `window.openai.sendFollowUpMessage` |
| Persist Widget State | Host-managed | `window.openai.setWidgetState(state)` |
| Native Modals / Checkout | Optional Extension | `window.openai.requestModal` / `requestCheckout` |

---

### Pillar E: Authentication (OAuth 2.1 & CIMD)

For plugins requiring user accounts:
- Conforms to **OAuth 2.1 with PKCE (`S256`)**.
- Uses **Client ID Metadata Documents (CIMD)** so ChatGPT uses `https://chatgpt.com/oauth/client.json` as its stable client identity.
- Exposes `/.well-known/oauth-protected-resource` on the MCP server to advertise authorization endpoints.

---

## 3. Analysis for SoftTech AI: Is this Needed?

### Why this is a Game-Changer for SoftTech AI:

1. **Enterprise & Business Appeal**:
   Companies using SoftTech AI don't just want a raw API—they want their business live inside **ChatGPT and Codex** as an official, branded plugin with custom widgets and AI workflows.
2. **Zero-Friction Publishing**:
   By outputting standard `.codex-plugin/` and `skills/` structures, SoftTech AI can offer a **"1-Click Export to ChatGPT Plugin"** feature.
3. **Marketplace & Private Team Distribution**:
   SoftTech AI can generate `.agents/plugins/marketplace.json`, allowing corporate teams to instantly load their company plugins into ChatGPT Desktop.
4. **Unified Standards**:
   Aligning our frontend widgets (`GenericWidget`, `CatalogLayout`, `CartDrawer`, `TableBlock`) with the official MCP Apps standard guarantees our widgets work across ChatGPT, Claude Desktop, and standalone web portals without modification.

---

## 4. Proposed Folder Structure for SoftTech AI Plugin Export

When a user in SoftTech AI clicks **"Export as ChatGPT Plugin"**, SoftTech AI can bundle the following directory:

```text
generated-plugin/
├── .codex-plugin/
│   └── plugin.json           # Auto-generated from user's company metadata & branding
├── skills/
│   ├── view-catalog/
│   │   └── SKILL.md          # Generated workflow for exploring products/packages
│   └── manage-orders/
│       └── SKILL.md          # Generated workflow for tracking & managing orders
├── .app.json                 # Connection mapping for remote MCP server
├── .mcp.json                 # Local MCP server configuration
├── assets/
│   ├── logo.png              # Auto-extracted company logo
│   └── icon.png              # Favicon / composer icon
└── marketplace.json          # Ready-to-use local marketplace entry
```

---

## 5. Strategic Recommendations for SoftTech AI

1. **Auto-Generate `SKILL.md` for Each Entity**:
   During schema analysis, generate contextual `SKILL.md` files (e.g. for `packages`, `orders`, `products`, `bookings`) detailing how ChatGPT should interact with those endpoints.
2. **Standardize Manifest Generator**:
   Add a backend generator function `generatePluginManifest(companyMetadata, apiSchema)` that outputs valid `.codex-plugin/plugin.json`.
3. **Support Local Marketplace JSON**:
   Provide a downloadable `.agents/plugins/marketplace.json` snippet so developers can test their generated plugins locally with one click.
4. **Dual Compatibility**:
   Maintain full support for both the open **MCP Apps standard** (`ui/notifications/tool-result`, `tools/call`) and **ChatGPT extensions** (`window.openai`).
