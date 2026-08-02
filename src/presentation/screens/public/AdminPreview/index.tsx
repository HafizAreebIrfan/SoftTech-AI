import React, { useState, useEffect } from "react";
import styles from "../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../hooks/usetheme";
import Sidebar from "./components/Sidebar";
import OnboardingTab from "./components/OnboardingTab";
import ApiTrackerTab from "./components/ApiTrackerTab";
import McpToolsTab from "./components/McpToolsTab";
import PlaygroundTab from "./components/PlaygroundTab";
import PlansTab from "./components/PlansTab";
import { ApiItem, OnboardingStep, McpTool, TerminalLog } from "./types";

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
          <p className={styles.workspaceSubtitle} style={{ color: colors.TextSecondary }}>
            Configure and audit APIs, toggle MCP schemas, test tools, and review subscription billing.
          </p>
        </div>

        {/* Dashboard Layout */}
        <div className={styles.dashboardBody}>
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            mcpTools={mcpTools}
          />

          {/* Right Content Area */}
          <div className={styles.contentArea}>
            {activeTab === "onboarding" && (
              <OnboardingTab
                onboardingSteps={onboardingSteps}
                toggleOnboardingStep={toggleOnboardingStep}
                apisCount={apis.length}
                enabledToolsCount={mcpTools.filter(t => t.enabled).length}
                totalToolsCount={mcpTools.length}
                activePlan={activePlan}
                onboardingProgress={onboardingProgress}
              />
            )}

            {activeTab === "apis" && (
              <ApiTrackerTab
                apiSearchQuery={apiSearchQuery}
                setApiSearchQuery={setApiSearchQuery}
                isAddApiOpen={isAddApiOpen}
                setIsAddApiOpen={setIsAddApiOpen}
                newApiName={newApiName}
                setNewApiName={setNewApiName}
                newApiMethod={newApiMethod}
                setNewApiMethod={setNewApiMethod}
                newApiUrl={newApiUrl}
                setNewApiUrl={setNewApiUrl}
                newApiEndpoint={newApiEndpoint}
                setNewApiEndpoint={setNewApiEndpoint}
                newApiAuth={newApiAuth}
                setNewApiAuth={setNewApiAuth}
                handleAddApi={handleAddApi}
                deleteApi={deleteApi}
                filteredApis={filteredApis}
              />
            )}

            {activeTab === "mcp-tools" && (
              <McpToolsTab
                toolSearchQuery={toolSearchQuery}
                setToolSearchQuery={setToolSearchQuery}
                toggleToolEnabled={toggleToolEnabled}
                filteredTools={filteredTools}
              />
            )}

            {activeTab === "playground" && (
              <PlaygroundTab
                mcpTools={mcpTools}
                selectedToolId={selectedToolId}
                setSelectedToolId={setSelectedToolId}
                playgroundLogs={playgroundLogs}
                playgroundInputs={playgroundInputs}
                setPlaygroundInputs={setPlaygroundInputs}
                isRunningTest={isRunningTest}
                handleRunTest={handleRunTest}
                testResult={testResult}
              />
            )}

            {activeTab === "plans" && (
              <PlansTab
                activePlan={activePlan}
                handleSelectPlan={handleSelectPlan}
                isUpgrading={isUpgrading}
                upgradeTarget={upgradeTarget}
                upgradeStatus={upgradeStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPreview;
