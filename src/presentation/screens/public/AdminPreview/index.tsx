import React, { useState, useEffect } from "react";
import styles from "../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { Link } from "@tanstack/react-router";

// Define Interfaces
interface ApiItem {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  baseUrl: string;
  endpoint: string;
  authtype: string;
  status: "Active" | "Testing" | "Inactive";
}

interface OnboardingStep {
  id: number;
  title: string;
  desc: string;
  completed: boolean;
}

interface McpParameter {
  name: string;
  type: string;
  desc: string;
  required: boolean;
}

interface McpTool {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  params: McpParameter[];
}

interface TerminalLog {
  time: string;
  type: "info" | "success" | "warning" | "command";
  text: string;
}

const AdminPreview: React.FC = () => {
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<string>("onboarding");

  // --- STATE 1: ONBOARDING ---
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);

  // --- STATE 2: API TRACKER ---
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [isAddApiOpen, setIsAddApiOpen] = useState(false);
  const [newApiName, setNewApiName] = useState("");
  const [newApiMethod, setNewApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [newApiUrl, setNewApiUrl] = useState("");
  const [newApiEndpoint, setNewApiEndpoint] = useState("");
  const [newApiAuth, setNewApiAuth] = useState("None");
  const [apiSearchQuery, setApiSearchQuery] = useState("");

  // --- STATE 3: MCP TOOLS ---
  const [mcpTools, setMcpTools] = useState<McpTool[]>([]);
  const [toolSearchQuery, setToolSearchQuery] = useState("");

  // --- STATE 4: PLAYGROUND ---
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [playgroundLogs, setPlaygroundLogs] = useState<TerminalLog[]>([]);
  const [playgroundInputs, setPlaygroundInputs] = useState<Record<string, string>>({});
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // --- STATE 5: PLANS ---
  const [activePlan, setActivePlan] = useState<string>("Pro");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<string>("");
  const [upgradeStatus, setUpgradeStatus] = useState<string>("");

  // --- LOAD DEFAULTS / LOCAL STORAGE ---
  useEffect(() => {
    // 1. Onboarding
    const savedOnboarding = localStorage.getItem("admin_preview_onboarding");
    if (savedOnboarding) {
      setOnboardingSteps(JSON.parse(savedOnboarding));
    } else {
      const defaults: OnboardingStep[] = [
        { id: 1, title: "Register Company Account", desc: "Set up your company profile and register your subdomain details.", completed: true },
        { id: 2, title: "Configure Base APIs", desc: "Register external API endpoints for mapping to the MCP service.", completed: true },
        { id: 3, title: "Verify MCP Tool Definitions", desc: "Check mapped schemas and parameters under the MCP Tools Manager.", completed: false },
        { id: 4, title: "Execute Playground Tests", desc: "Run simulated API calls in the interactive testing console.", completed: false },
        { id: 5, title: "Unlock Production Access", desc: "Upgrade plan, authorize API keys, and deploy to live widgets.", completed: false }
      ];
      setOnboardingSteps(defaults);
      localStorage.setItem("admin_preview_onboarding", JSON.stringify(defaults));
    }

    // 2. APIs
    const savedApis = localStorage.getItem("admin_preview_apis");
    if (savedApis) {
      setApis(JSON.parse(savedApis));
    } else {
      const defaults: ApiItem[] = [
        { id: "api-1", name: "Inventory Database", method: "GET", baseUrl: "https://api.acme-retail.com", endpoint: "/v1/products", authtype: "API Key", status: "Active" },
        { id: "api-2", name: "Payment Gateway", method: "POST", baseUrl: "https://secure.paylink.net", endpoint: "/payments/charge", authtype: "OAuth2", status: "Active" },
        { id: "api-3", name: "Courier Tracker", method: "GET", baseUrl: "https://api.fastship.com", endpoint: "/shipments/track", authtype: "None", status: "Testing" }
      ];
      setApis(defaults);
      localStorage.setItem("admin_preview_apis", JSON.stringify(defaults));
    }

    // 3. MCP Tools
    const savedTools = localStorage.getItem("admin_preview_tools");
    if (savedTools) {
      setMcpTools(JSON.parse(savedTools));
    } else {
      const defaults: McpTool[] = [
        {
          id: "t-1",
          name: "get_product_stock",
          desc: "Retrieve real-time product quantities in specified warehouses.",
          enabled: true,
          params: [
            { name: "productId", type: "string", desc: "The unique product code (e.g. prod-101)", required: true },
            { name: "location", type: "string", desc: "Optional warehouse location code", required: false }
          ]
        },
        {
          id: "t-2",
          name: "trigger_payment",
          desc: "Authorize and execute a card charge transaction through Secure Paylink.",
          enabled: true,
          params: [
            { name: "amount", type: "number", desc: "Total transaction amount in USD", required: true },
            { name: "cardToken", type: "string", desc: "Encrypted payment card token", required: true },
            { name: "orderId", type: "string", desc: "Internal sales order tracking ID", required: true }
          ]
        },
        {
          id: "t-3",
          name: "get_shipping_status",
          desc: "Lookup package delivery updates, carrier, and ETA by tracking code.",
          enabled: false,
          params: [
            { name: "trackingNumber", type: "string", desc: "The carrier tracking identifier", required: true }
          ]
        }
      ];
      setMcpTools(defaults);
      localStorage.setItem("admin_preview_tools", JSON.stringify(defaults));
    }

    // 4. Plan
    const savedPlan = localStorage.getItem("admin_preview_plan");
    if (savedPlan) {
      setActivePlan(savedPlan);
    }

    // 5. Initial logs
    setPlaygroundLogs([
      { time: getCurrentTime(), type: "info", text: "MCP Agent Playground Initialized." },
      { time: getCurrentTime(), type: "success", text: "Connected securely to SoftTech AI Core Gateway v1.4.2." }
    ]);
  }, []);

  // Helper time string
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(" ")[0];
  };

  // --- ACTIONS: ONBOARDING ---
  const toggleOnboardingStep = (id: number) => {
    const updated = onboardingSteps.map(step =>
      step.id === id ? { ...step, completed: !step.completed } : step
    );
    setOnboardingSteps(updated);
    localStorage.setItem("admin_preview_onboarding", JSON.stringify(updated));

    // Log step toggle in playground terminal
    const target = updated.find(s => s.id === id);
    addLog("info", `Onboarding Checklist updated: "${target?.title}" is now ${target?.completed ? "COMPLETED" : "PENDING"}.`);
  };

  const onboardingProgress = onboardingSteps.length
    ? Math.round((onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100)
    : 0;

  // --- ACTIONS: API TRACKER ---
  const handleAddApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName || !newApiUrl || !newApiEndpoint) return;

    const newApi: ApiItem = {
      id: "api-" + Date.now(),
      name: newApiName,
      method: newApiMethod,
      baseUrl: newApiUrl,
      endpoint: newApiEndpoint,
      authtype: newApiAuth,
      status: "Testing"
    };

    const updated = [...apis, newApi];
    setApis(updated);
    localStorage.setItem("admin_preview_apis", JSON.stringify(updated));

    // Clear form
    setNewApiName("");
    setNewApiUrl("");
    setNewApiEndpoint("");
    setNewApiAuth("None");
    setIsAddApiOpen(false);

    // Auto-generate a mock MCP tool for this API!
    const cleanToolName = newApiName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_call";
    const newTool: McpTool = {
      id: "t-" + Date.now(),
      name: cleanToolName,
      desc: `Simulated MCP tool generated for the API: "${newApiName}".`,
      enabled: true,
      params: [
        { name: "payload", type: "string", desc: "Generic JSON string containing variables", required: true }
      ]
    };
    const updatedTools = [...mcpTools, newTool];
    setMcpTools(updatedTools);
    localStorage.setItem("admin_preview_tools", JSON.stringify(updatedTools));

    // Add log
    addLog("success", `New API registered: ${newApiName} (${newApiMethod} ${newApiEndpoint})`);
    addLog("info", `Auto-mapped MCP Tool generated: "${cleanToolName}"`);
  };

  const deleteApi = (id: string) => {
    const target = apis.find(a => a.id === id);
    const updated = apis.filter(a => a.id !== id);
    setApis(updated);
    localStorage.setItem("admin_preview_apis", JSON.stringify(updated));
    if (target) {
      addLog("warning", `API removed: "${target.name}"`);
    }
  };

  const filteredApis = apis.filter(api =>
    api.name.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
    api.endpoint.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
    api.baseUrl.toLowerCase().includes(apiSearchQuery.toLowerCase())
  );

  // --- ACTIONS: MCP TOOLS ---
  const toggleToolEnabled = (id: string) => {
    const updated = mcpTools.map(tool =>
      tool.id === id ? { ...tool, enabled: !tool.enabled } : tool
    );
    setMcpTools(updated);
    localStorage.setItem("admin_preview_tools", JSON.stringify(updated));

    const target = updated.find(t => t.id === id);
    addLog("info", `MCP Tool "${target?.name}" ${target?.enabled ? "ENABLED" : "DISABLED"}.`);
  };

  const filteredTools = mcpTools.filter(tool =>
    tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
    tool.desc.toLowerCase().includes(toolSearchQuery.toLowerCase())
  );

  // --- ACTIONS: PLAYGROUND ---
  const addLog = (type: "info" | "success" | "warning" | "command", text: string) => {
    setPlaygroundLogs(prev => [
      ...prev,
      { time: getCurrentTime(), type, text }
    ]);
  };

  const handleRunTest = () => {
    const activeTool = mcpTools.find(t => t.id === selectedToolId);
    if (!activeTool) return;

    setIsRunningTest(true);
    setTestResult(null);
    addLog("command", `exec --tool ${activeTool.name} --args ${JSON.stringify(playgroundInputs)}`);

    // Simulate logs in sequence
    setTimeout(() => {
      addLog("info", `[MCP Bridge] Mapping inputs to server instance...`);
    }, 400);

    setTimeout(() => {
      addLog("info", `[Gateway] Dispatching HTTP call to endpoint: ${activeTool.name === "get_product_stock" ? "https://api.acme-retail.com/v1/products" : "https://secure.paylink.net/payments/charge"}`);
    }, 900);

    setTimeout(() => {
      addLog("success", `[Gateway] Response 200 OK received in 430ms.`);
    }, 1400);

    setTimeout(() => {
      setIsRunningTest(false);

      // Create visual mock widgets matching specific tool calls
      if (activeTool.name === "get_product_stock") {
        const prodId = playgroundInputs["productId"] || "prod-101";
        const loc = playgroundInputs["location"] || "Central Warehouse";
        setTestResult({
          type: "product_stock",
          data: {
            sku: prodId.toUpperCase(),
            warehouse: loc,
            stockLevel: Math.floor(Math.random() * 250) + 10,
            price: "$149.99",
            lastUpdated: new Date().toLocaleTimeString(),
            status: "In Stock"
          }
        });
        addLog("success", `[MCP Tool] Output returned structure for widget layout "MetricCard".`);
      } else if (activeTool.name === "trigger_payment") {
        const amount = playgroundInputs["amount"] || "99.99";
        const order = playgroundInputs["orderId"] || "ORD-9482";
        setTestResult({
          type: "payment",
          data: {
            transactionId: "TXN-" + Math.floor(Math.random() * 10000000),
            orderRef: order,
            amountCharged: `$${parseFloat(amount).toFixed(2)}`,
            gatewayStatus: "SUCCESS",
            brand: "Visa (**** 4242)",
            timestamp: new Date().toLocaleString()
          }
        });
        addLog("success", `[MCP Tool] Output returned structure for widget layout "ReceiptCard".`);
      } else {
        setTestResult({
          type: "generic",
          data: {
            status: "SUCCESS",
            processedAt: new Date().toISOString(),
            inputReceived: playgroundInputs,
            mockDetails: "This is a custom API response rendering dynamically."
          }
        });
        addLog("success", `[MCP Tool] Output returned structure for widget layout "TableBlock".`);
      }
    }, 2000);
  };

  // --- ACTIONS: PLANS ---
  const handleSelectPlan = (planName: string) => {
    if (planName === activePlan) return;
    setUpgradeTarget(planName);
    setIsUpgrading(true);
    setUpgradeStatus("Initializing Gateway Connection...");

    setTimeout(() => {
      setUpgradeStatus("Securing Vault Protocol...");
    }, 800);

    setTimeout(() => {
      setUpgradeStatus("Applying Subscription Configuration...");
    }, 1600);

    setTimeout(() => {
      setActivePlan(planName);
      localStorage.setItem("admin_preview_plan", planName);
      setIsUpgrading(false);
      addLog("success", `Subscription tier upgraded to [${planName}] Plan!`);
    }, 2400);
  };

  return (
    <div className={styles.previewContainer}>
      {/* Glow Effects */}
      <div className={styles.glassBlob1} />
      <div className={styles.glassBlob2} />
      <div className={styles.glassBlob3} />

      <div className={styles.workspaceCard}>
        {/* Header Section */}
        <div className={styles.workspaceHeader}>
          <h1 className={styles.workspaceTitle}>Company Admin Workspace</h1>
          <p className={styles.workspaceSubtitle}>
            Configure and audit APIs, toggle MCP schemas, test tools, and review subscription billing.
          </p>
        </div>

        {/* Dashboard Layout */}
        <div className={styles.dashboardBody}>
          {/* Left Sidebar */}
          <div className={styles.sidebar}>
            <button
              className={`${styles.sidebarBtn} ${activeTab === "onboarding" ? styles.activeSidebarBtn : ""}`}
              onClick={() => setActiveTab("onboarding")}
            >
              🏛️ Setup & Onboarding
            </button>
            <button
              className={`${styles.sidebarBtn} ${activeTab === "apis" ? styles.activeSidebarBtn : ""}`}
              onClick={() => setActiveTab("apis")}
            >
              🔌 API Management
            </button>
            <button
              className={`${styles.sidebarBtn} ${activeTab === "mcp-tools" ? styles.activeSidebarBtn : ""}`}
              onClick={() => setActiveTab("mcp-tools")}
            >
              🛠️ MCP Tool Definitions
            </button>
            <button
              className={`${styles.sidebarBtn} ${activeTab === "playground" ? styles.activeSidebarBtn : ""}`}
              onClick={() => {
                setActiveTab("playground");
                // Select first enabled tool automatically if none selected
                if (!selectedToolId) {
                  const firstEnabled = mcpTools.find(t => t.enabled);
                  if (firstEnabled) setSelectedToolId(firstEnabled.id);
                }
              }}
            >
              🧪 Testing Playground
            </button>
            <button
              className={`${styles.sidebarBtn} ${activeTab === "plans" ? styles.activeSidebarBtn : ""}`}
              onClick={() => setActiveTab("plans")}
            >
              💳 Plans & Subscriptions
            </button>
          </div>

          {/* Right Content Area */}
          <div className={styles.contentArea}>
            
            {/* 1. TABS: ONBOARDING */}
            {activeTab === "onboarding" && (
              <>
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>🏛️ Acme Corp Workspace Overview</h2>
                    <span className={styles.badge} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      Status: Active Developer
                    </span>
                  </div>
                  
                  {/* Metric Cards Row */}
                  <div className={styles.metricRow}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricValue}>{onboardingProgress}%</span>
                      <span className={styles.metricLabel}>Onboarding Progress</span>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricValue}>{apis.length}</span>
                      <span className={styles.metricLabel}>Registered APIs</span>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricValue}>
                        {mcpTools.filter(t => t.enabled).length}/{mcpTools.length}
                      </span>
                      <span className={styles.metricLabel}>MCP Tools Enabled</span>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricValue} style={{ fontSize: "1.5rem", height: "48px", display: "flex", alignItems: "center" }}>
                        {activePlan}
                      </span>
                      <span className={styles.metricLabel}>Subscription Plan</span>
                    </div>
                  </div>
                </div>

                {/* Onboarding Checklist */}
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📋 Setup Checklist</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--app-text-secondary)" }}>
                      Complete these tasks to activate live MCP integration.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {onboardingSteps.map(step => (
                      <div className={styles.stepItem} key={step.id}>
                        <input
                          type="checkbox"
                          className={styles.stepCheckbox}
                          checked={step.completed}
                          onChange={() => toggleOnboardingStep(step.id)}
                        />
                        <div className={styles.stepContent}>
                          <span className={`${styles.stepTitle} ${step.completed ? styles.stepTitleCompleted : ""}`}>
                            {step.title}
                          </span>
                          <span className={styles.stepDesc}>{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 2. TABS: API MANAGEMENT */}
            {activeTab === "apis" && (
              <>
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>🔌 Registered API Integrations</h2>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setIsAddApiOpen(true)}
                    >
                      + Add API Endpoint
                    </button>
                  </div>

                  {/* Filter Search */}
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Search API Name, Base URL, or Endpoint..."
                      value={apiSearchQuery}
                      onChange={(e) => setApiSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* API list Table */}
                  <div className={styles.tableContainer}>
                    {filteredApis.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "2rem", color: "var(--app-text-secondary)" }}>
                        No API endpoints matched your query.
                      </div>
                    ) : (
                      <table className={styles.customTable}>
                        <thead>
                          <tr>
                            <th>API Service</th>
                            <th>Method</th>
                            <th>Target URL</th>
                            <th>Authentication</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApis.map(api => (
                            <tr key={api.id}>
                              <td style={{ fontWeight: "700" }}>{api.name}</td>
                              <td>
                                <span className={`${styles.badge} ${
                                  api.method === "GET" ? styles.badgeGet :
                                  api.method === "POST" ? styles.badgePost :
                                  api.method === "PUT" ? styles.badgePut :
                                  styles.badgeDelete
                                }`}>
                                  {api.method}
                                </span>
                              </td>
                              <td style={{ fontFamily: "monospace", fontSize: "0.8rem", opacity: 0.8 }}>
                                <span style={{ color: "var(--app-text-secondary)" }}>{api.baseUrl}</span>
                                <span style={{ color: "var(--app-text-primary)", fontWeight: "600" }}>{api.endpoint}</span>
                              </td>
                              <td>{api.authtype}</td>
                              <td>
                                <span style={{ display: "flex", alignItems: "center" }}>
                                  <span className={`${styles.statusDot} ${api.status === "Active" ? styles.statusDotActive : styles.statusDotTesting}`} />
                                  {api.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={styles.btnSecondary}
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#ef4444" }}
                                  onClick={() => deleteApi(api.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* API ADDING MODAL */}
                {isAddApiOpen && (
                  <div className={styles.modalOverlay}>
                    <form className={styles.modalContent} onSubmit={handleAddApi}>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "800", borderBottom: "1px solid var(--app-card-border)", paddingBottom: "0.75rem" }}>
                        Register New API Endpoint
                      </h3>
                      
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>API Integration Name</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="e.g. Sales Inventory Database"
                          value={newApiName}
                          onChange={(e) => setNewApiName(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>HTTP Request Method</label>
                          <select
                            className={styles.formSelect}
                            value={newApiMethod}
                            onChange={(e) => setNewApiMethod(e.target.value as any)}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Authentication Type</label>
                          <select
                            className={styles.formSelect}
                            value={newApiAuth}
                            onChange={(e) => setNewApiAuth(e.target.value)}
                          >
                            <option value="None">None (Public)</option>
                            <option value="API Key">API Key Header</option>
                            <option value="Bearer Token">Bearer JWT Token</option>
                            <option value="OAuth2">OAuth 2.0 Credentials</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Base Host URL</label>
                        <input
                          type="url"
                          className={styles.formInput}
                          placeholder="e.g. https://api.mycompany.com"
                          value={newApiUrl}
                          onChange={(e) => setNewApiUrl(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Endpoint Path</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="e.g. /v2/inventory/items"
                          value={newApiEndpoint}
                          onChange={(e) => setNewApiEndpoint(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => setIsAddApiOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={styles.btnPrimary}
                        >
                          Register API
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* 3. TABS: MCP TOOLS */}
            {activeTab === "mcp-tools" && (
              <>
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>🛠️ Model Context Protocol (MCP) Tool Specifications</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--app-text-secondary)" }}>
                      AI Agents will call these tools to interact with your registered company APIs dynamically.
                    </p>
                  </div>

                  {/* Filter Search */}
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Search Tool Name or Schema descriptions..."
                      value={toolSearchQuery}
                      onChange={(e) => setToolSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Tools grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredTools.map(tool => (
                      <div className={styles.sectionCard} style={{ background: "rgba(255, 255, 255, 0.005)", border: "1px solid var(--app-card-border)" }} key={tool.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={{ fontSize: "1.1rem", fontFamily: "monospace", fontWeight: "700", color: "#bb9af7" }}>
                              {tool.name}
                            </span>
                            <p style={{ fontSize: "0.875rem", margin: "0.25rem 0", color: "var(--app-text-secondary)" }}>
                              {tool.desc}
                            </p>
                          </div>
                          
                          {/* Toggle Tool Switch */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                            <label className={styles.toggleContainer}>
                              <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={tool.enabled}
                                onChange={() => toggleToolEnabled(tool.id)}
                              />
                              <span className={styles.toggleSlider} />
                            </label>
                            <span style={{ fontSize: "0.75rem", color: tool.enabled ? "#10b981" : "var(--app-text-secondary)", fontWeight: "600" }}>
                              {tool.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </div>

                        {/* Input Schema Parameters */}
                        <div style={{ background: "rgba(0, 0, 0, 0.15)", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px solid rgba(255, 255, 255, 0.02)" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--app-text-secondary)" }}>
                            Input Argument Schema
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                            {tool.params.map(param => (
                              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed rgba(255, 255, 255, 0.04)", paddingBottom: "0.25rem", fontSize: "0.8rem" }} key={param.name}>
                                <span style={{ fontFamily: "monospace", color: "var(--app-text-primary)" }}>
                                  {param.name}
                                  {param.required && <span style={{ color: "#ef4444" }}> *</span>}
                                </span>
                                <span style={{ color: "var(--app-text-secondary)" }}>
                                  ({param.type}) - {param.desc}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 4. TABS: PLAYGROUND */}
            {activeTab === "playground" && (
              <>
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>🧪 MCP Interaction & Testing Playground</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--app-text-secondary)" }}>
                      Execute tools inside a simulated sandboxed run window to inspect request execution, performance, and UI outcomes.
                    </p>
                  </div>

                  <div className={styles.splitscreen}>
                    {/* LEFT SPLIT: PARAMETERS CONTROL */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Select Tool to Test</label>
                        <select
                          className={styles.formSelect}
                          value={selectedToolId}
                          onChange={(e) => {
                            setSelectedToolId(e.target.value);
                            setPlaygroundInputs({});
                            setTestResult(null);
                          }}
                        >
                          <option value="">-- Choose Enabled Tool --</option>
                          {mcpTools.filter(t => t.enabled).map(t => (
                            <option value={t.id} key={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tool description & params */}
                      {(() => {
                        const activeTool = mcpTools.find(t => t.id === selectedToolId);
                        if (!activeTool) return (
                          <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.01)", borderRadius: "8px", color: "var(--app-text-secondary)" }}>
                            Select an enabled tool from the dropdown above to configure parameters.
                          </div>
                        );

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--app-card-border)", borderRadius: "8px", padding: "1rem" }}>
                              <h4 style={{ fontWeight: "700", fontFamily: "monospace", color: "#bb9af7" }}>{activeTool.name}</h4>
                              <p style={{ fontSize: "0.825rem", color: "var(--app-text-secondary)", marginTop: "0.25rem" }}>{activeTool.desc}</p>
                            </div>

                            {/* Dynamically build form inputs for tool arguments */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                              <h5 style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: "var(--app-text-secondary)" }}>
                                Call Arguments
                              </h5>
                              {activeTool.params.map(param => (
                                <div className={styles.formGroup} key={param.name}>
                                  <label className={styles.formLabel}>
                                    {param.name} {param.required && <span style={{ color: "#ef4444" }}>*</span>}
                                    <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--app-text-secondary)", marginLeft: "0.5rem" }}>
                                      ({param.type}) - {param.desc}
                                    </span>
                                  </label>
                                  <input
                                    type={param.type === "number" ? "number" : "text"}
                                    className={styles.formInput}
                                    placeholder={param.type === "number" ? "e.g. 50" : "e.g. test-value"}
                                    value={playgroundInputs[param.name] || ""}
                                    onChange={(e) => setPlaygroundInputs(prev => ({
                                      ...prev,
                                      [param.name]: e.target.value
                                    }))}
                                    required={param.required}
                                  />
                                </div>
                              ))}
                            </div>

                            <button
                              className={styles.btnPrimary}
                              style={{ width: "100%", height: "42px" }}
                              disabled={isRunningTest}
                              onClick={handleRunTest}
                            >
                              {isRunningTest ? "Running Test Simulation..." : "🚀 Execute Tool Call"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* RIGHT SPLIT: CONSOLE LOGS & OUTPUT */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <h5 style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: "var(--app-text-secondary)" }}>
                        Playground Console Logs
                      </h5>
                      <div className={styles.terminalContainer}>
                        {playgroundLogs.map((log, index) => (
                          <div className={styles.terminalLog} key={index}>
                            <span className={styles.terminalTime}>[{log.time}]</span>
                            <span className={
                              log.type === "success" ? styles.terminalSuccess :
                              log.type === "warning" ? styles.terminalWarning :
                              log.type === "command" ? styles.terminalCommand :
                              styles.terminalInfo
                            }>
                              {log.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* VISUAL WIDGET PREVIEW RESULT */}
                      {testResult && (
                        <div className={styles.sectionCard} style={{ background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", color: "var(--app-text-secondary)", letterSpacing: "0.05em" }}>
                            Dynamic Visual Widget Output
                          </span>
                          
                          {/* 1. STOCK LEVEL WIDGET MOCK */}
                          {testResult.type === "product_stock" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <h4 style={{ fontWeight: "800", color: "var(--app-text-primary)" }}>{testResult.data.sku}</h4>
                                  <span style={{ fontSize: "0.8rem", color: "var(--app-text-secondary)" }}>Warehouse: {testResult.data.warehouse}</span>
                                </div>
                                <span className={styles.badge} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                  {testResult.data.status}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "1.5rem" }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: "0.75rem", color: "var(--app-text-secondary)" }}>Stock Level</span>
                                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#10b981" }}>{testResult.data.stockLevel} pcs</div>
                                </div>
                                <div style={{ flex: 1, borderLeft: "1px solid var(--app-card-border)", paddingLeft: "1.5rem" }}>
                                  <span style={{ fontSize: "0.75rem", color: "var(--app-text-secondary)" }}>Pricing Tier</span>
                                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--app-text-primary)" }}>{testResult.data.price}</div>
                                </div>
                              </div>
                              <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${Math.min(100, (testResult.data.stockLevel / 250) * 100)}%`, height: "100%", backgroundColor: "#10b981", boxShadow: "0 0 10px #10b981" }} />
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "var(--app-text-secondary)", textAlign: "right" }}>Last Synced: {testResult.data.lastUpdated}</span>
                            </div>
                          )}

                          {/* 2. TRANSACTION RECEIPT WIDGET MOCK */}
                          {testResult.type === "payment" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem", background: "rgba(0,0,0,0.1)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.02)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(255, 255, 255, 0.1)", paddingBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.85rem", color: "var(--app-text-secondary)" }}>Receipt Info</span>
                                <span className={styles.badge} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                  {testResult.data.gatewayStatus}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "var(--app-text-secondary)" }}>Txn ID:</span>
                                <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{testResult.data.transactionId}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "var(--app-text-secondary)" }}>Order Reference:</span>
                                <span>{testResult.data.orderRef}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "var(--app-text-secondary)" }}>Card Details:</span>
                                <span style={{ opacity: 0.8 }}>{testResult.data.brand}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "0.5rem" }}>
                                <span style={{ fontWeight: "700" }}>Total Charged:</span>
                                <span style={{ color: "#10b981", fontWeight: "800", fontSize: "1.1rem" }}>{testResult.data.amountCharged}</span>
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "var(--app-text-secondary)", marginTop: "0.25rem", textAlign: "center" }}>{testResult.data.timestamp}</span>
                            </div>
                          )}

                          {/* 3. GENERIC DATA TABLE BLOCK */}
                          {testResult.type === "generic" && (
                            <div style={{ marginTop: "1rem" }}>
                              <table className={styles.customTable} style={{ fontSize: "0.8rem" }}>
                                <thead>
                                  <tr>
                                    <th>Field Key</th>
                                    <th>Returned Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(testResult.data).map(([key, val]) => (
                                    <tr key={key}>
                                      <td style={{ fontWeight: "700", color: "#bb9af7" }}>{key}</td>
                                      <td>
                                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 5. TABS: SUBSCRIPTION PLANS */}
            {activeTab === "plans" && (
              <>
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>💳 Subscription & Plans Billing</h2>
                    <span className={styles.badge} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      Active Plan: {activePlan}
                    </span>
                  </div>
                  
                  {/* Plan Selection Cards Grid */}
                  <div className={styles.planGrid}>
                    
                    {/* TIER 1: STARTER */}
                    <div className={`${styles.planCard} ${activePlan === "Starter" ? styles.planCardActive : ""}`}>
                      {activePlan === "Starter" && <div className={styles.planRibbon}>Current</div>}
                      <h3 className={styles.planName}>Starter</h3>
                      <div className={styles.planPrice}>
                        <span className={styles.planPriceAmount}>$49</span>
                        <span className={styles.planPricePeriod}>/mo</span>
                      </div>
                      <p style={{ fontSize: "0.825rem", color: "var(--app-text-secondary)" }}>
                        Ideal for teams configuring initial mock REST APIs and simple AI agents.
                      </p>
                      <ul className={styles.planFeatures}>
                        <li className={styles.planFeatureItem}>✓ Up to 3 API Endpoints</li>
                        <li className={styles.planFeatureItem}>✓ 5 Enabled MCP Tools</li>
                        <li className={styles.planFeatureItem}>✓ Standard API Playground</li>
                        <li className={styles.planFeatureItem}>✗ Custom Visual Widget Overrides</li>
                      </ul>
                      <button
                        className={activePlan === "Starter" ? styles.btnSecondary : styles.btnPrimary}
                        style={{ width: "100%", marginTop: "auto" }}
                        disabled={activePlan === "Starter"}
                        onClick={() => handleSelectPlan("Starter")}
                      >
                        {activePlan === "Starter" ? "Active Plan" : "Choose Starter"}
                      </button>
                    </div>

                    {/* TIER 2: PRO */}
                    <div className={`${styles.planCard} ${activePlan === "Pro" ? styles.planCardActive : ""}`}>
                      {activePlan === "Pro" && <div className={styles.planRibbon}>Current</div>}
                      <h3 className={styles.planName}>Developer Pro</h3>
                      <div className={styles.planPrice}>
                        <span className={styles.planPriceAmount}>$149</span>
                        <span className={styles.planPricePeriod}>/mo</span>
                      </div>
                      <p style={{ fontSize: "0.825rem", color: "var(--app-text-secondary)" }}>
                        Designed for fast-growing companies deploying dynamic widgets with security credentials.
                      </p>
                      <ul className={styles.planFeatures}>
                        <li className={styles.planFeatureItem}>✓ Unlimited Registered APIs</li>
                        <li className={styles.planFeatureItem}>✓ 20 Enabled MCP Tools</li>
                        <li className={styles.planFeatureItem}>✓ Fully Interactive Playground</li>
                        <li className={styles.planFeatureItem}>✓ Custom Visual Widget Overrides</li>
                      </ul>
                      <button
                        className={activePlan === "Pro" ? styles.btnSecondary : styles.btnPrimary}
                        style={{ width: "100%", marginTop: "auto" }}
                        disabled={activePlan === "Pro"}
                        onClick={() => handleSelectPlan("Pro")}
                      >
                        {activePlan === "Pro" ? "Active Plan" : "Choose Pro"}
                      </button>
                    </div>

                    {/* TIER 3: ENTERPRISE */}
                    <div className={`${styles.planCard} ${activePlan === "Enterprise" ? styles.planCardActive : ""}`}>
                      {activePlan === "Enterprise" && <div className={styles.planRibbon}>Current</div>}
                      <h3 className={styles.planName}>Enterprise</h3>
                      <div className={styles.planPrice}>
                        <span className={styles.planPriceAmount}>$499</span>
                        <span className={styles.planPricePeriod}>/mo</span>
                      </div>
                      <p style={{ fontSize: "0.825rem", color: "var(--app-text-secondary)" }}>
                        For high-volume transaction architectures requiring specialized SLA support.
                      </p>
                      <ul className={styles.planFeatures}>
                        <li className={styles.planFeatureItem}>✓ Unlimited Endpoints & Tools</li>
                        <li className={styles.planFeatureItem}>✓ Premium Dedicated Hosting Bridge</li>
                        <li className={styles.planFeatureItem}>✓ Custom OAuth SSO Integration</li>
                        <li className={styles.planFeatureItem}>✓ 24/7 Priority Support & SLA</li>
                      </ul>
                      <button
                        className={activePlan === "Enterprise" ? styles.btnSecondary : styles.btnPrimary}
                        style={{ width: "100%", marginTop: "auto" }}
                        disabled={activePlan === "Enterprise"}
                        onClick={() => handleSelectPlan("Enterprise")}
                      >
                        {activePlan === "Enterprise" ? "Active Plan" : "Choose Enterprise"}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Billing Summary Info */}
                <div className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle} style={{ fontSize: "1rem" }}>💳 Billing History</h3>
                  </div>
                  <table className={styles.customTable} style={{ fontSize: "0.8rem" }}>
                    <thead>
                      <tr>
                        <th>Billing Date</th>
                        <th>Billing Cycle</th>
                        <th>Payment Method</th>
                        <th>Total Invoiced</th>
                        <th>Receipt Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>July 15, 2026</td>
                        <td>Monthly Renewal [Pro]</td>
                        <td>Visa ending in 4242</td>
                        <td>$149.00</td>
                        <td><span style={{ color: "#10b981", fontWeight: "700" }}>PAID</span></td>
                      </tr>
                      <tr>
                        <td>June 15, 2026</td>
                        <td>Monthly Renewal [Pro]</td>
                        <td>Visa ending in 4242</td>
                        <td>$149.00</td>
                        <td><span style={{ color: "#10b981", fontWeight: "700" }}>PAID</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* UPGRADE LOADER OVERLAY */}
                {isUpgrading && (
                  <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ alignItems: "center", textAlign: "center", gap: "1.5rem" }}>
                      <div style={{
                        width: "50px",
                        height: "50px",
                        border: "5px solid rgba(255,255,255,0.05)",
                        borderTopColor: "var(--app-brand-emerald)",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }} />
                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                      <div>
                        <h4 style={{ fontSize: "1.2rem", fontWeight: "800" }}>Activating {upgradeTarget} Plan</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--app-text-secondary)", marginTop: "0.5rem" }}>
                          {upgradeStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPreview;
