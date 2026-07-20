import { create } from "zustand";
import { AIAgent, AILog, AIProviderStatus, AIClientAccount } from "../../types/ai";

interface AIState {
  perspective: 'subscriber' | 'provider';
  agents: AIAgent[];
  selectedAgentId: string;
  logs: AILog[];
  providers: AIProviderStatus[];
  clientAccounts: AIClientAccount[];
  globalMetrics: {
    totalExecutions: number;
    avgDuration: number;
    totalTokens: number;
    costSavings: number;
  };

  // Modals state
  agentModalOpen: boolean;
  editingAgent: AIAgent | null;
  onboardModalOpen: boolean;

  // Actions
  setPerspective: (val: 'subscriber' | 'provider') => void;
  setSelectedAgentId: (id: string) => void;
  
  // Agent CRUD
  openAgentModal: (agent?: AIAgent) => void;
  closeAgentModal: () => void;
  saveAgent: (title: string, description: string) => void;
  deleteAgent: (id: string) => void;

  // Agent execution
  triggerAgent: (id: string) => void;
  stopAgent: (id: string) => void;
  
  // Client CRUD
  openOnboardModal: () => void;
  closeOnboardModal: () => void;
  onboardClient: (companyName: string, email: string, tier: 'Free' | 'Pro' | 'Enterprise') => void;
  toggleClientStatus: (id: string) => void;

  addLog: (agentId: string | undefined, level: 'info' | 'warn' | 'error' | 'success', message: string) => void;
  clearLogs: () => void;
  resetStore: () => void;
}

const INITIAL_AGENTS: AIAgent[] = [
  {
    id: "lead_gen",
    title: "Autonomous Lead Prospector",
    description: "Monitors search indexes, pulls raw business listings, enriches details, and enqueues clean outputs.",
    status: "Idle",
    successRate: 98.4,
    lastExecutionStats: { duration: "14.2s", tokensUsed: 42000, cost: 0.084 }
  },
  {
    id: "code_rev",
    title: "PR Automated Reviewer",
    description: "Monitors incoming GitHub webhooks, runs linter checks, evaluates code changes, and replies with code suggestions.",
    status: "Idle",
    successRate: 94.1,
    lastExecutionStats: { duration: "8.5s", tokensUsed: 125000, cost: 0.25 }
  },
  {
    id: "media_sched",
    title: "Social Scheduler Bot",
    description: "Scans corporate RSS releases, writes customized text summaries, generates visual assets, and pushes webhook posts.",
    status: "Idle",
    successRate: 99.2,
    lastExecutionStats: { duration: "6.1s", tokensUsed: 18000, cost: 0.036 }
  },
  {
    id: "support_bot",
    title: "Support Classifier Bot",
    description: "Evaluates support tickets, performs semantic vector lookups on Qdrant, and drafts matching documentation replies.",
    status: "Idle",
    successRate: 92.5,
    lastExecutionStats: { duration: "4.8s", tokensUsed: 35000, cost: 0.07 }
  }
];

const INITIAL_PROVIDERS: AIProviderStatus[] = [
  { name: "OpenAI API", status: "online", latency: 142, uptime: "99.98%" },
  { name: "Anthropic Claude", status: "online", latency: 210, uptime: "99.95%" },
  { name: "Google Gemini", status: "online", latency: 98, uptime: "100.00%" },
  { name: "DeepSeek Coder", status: "online", latency: 180, uptime: "99.85%" }
];

const INITIAL_CLIENTS: AIClientAccount[] = [
  { id: "cli_1", companyName: "Stark Industries", email: "pepper@stark.com", tier: "Enterprise", status: "Active" },
  { id: "cli_2", companyName: "Wayne Enterprises", email: "lucius@wayne.com", tier: "Enterprise", status: "Active" },
  { id: "cli_3", companyName: "Cyberdyne Systems", email: "miles@cyberdyne.com", tier: "Pro", status: "Suspended" },
  { id: "cli_4", companyName: "Acme Corporation", email: "coyote@acme.com", tier: "Free", status: "Active" }
];

export const useAIStore = create<AIState>((set, get) => {
  let simulationTimeouts: Record<string, any> = {};

  return {
    perspective: 'subscriber',
    agents: INITIAL_AGENTS,
    selectedAgentId: "lead_gen",
    logs: [
      { id: "log_init", agentId: undefined, timestamp: "22:00:00", level: "info", message: "AuraPipeline Agent Workspace initialized successfully." },
      { id: "log_l1", agentId: "lead_gen", timestamp: "22:01:00", level: "info", message: "Standby diagnostics for Lead Prospector passed." },
      { id: "log_c1", agentId: "code_rev", timestamp: "22:01:15", level: "success", message: "PR Reviewer successfully initialized webhook hookups." }
    ],
    providers: INITIAL_PROVIDERS,
    clientAccounts: INITIAL_CLIENTS,
    globalMetrics: {
      totalExecutions: 24912,
      avgDuration: 8.4,
      totalTokens: 142890000,
      costSavings: 2857.80
    },

    agentModalOpen: false,
    editingAgent: null,
    onboardModalOpen: false,

    setPerspective: (val) => set({ perspective: val }),

    setSelectedAgentId: (id) => set({ selectedAgentId: id }),

    openAgentModal: (agent) => set({ agentModalOpen: true, editingAgent: agent || null }),
    closeAgentModal: () => set({ agentModalOpen: false, editingAgent: null }),

    saveAgent: (title, description) => {
      const { editingAgent, agents, addLog } = get();
      if (editingAgent) {
        // Edit mode
        set({
          agents: agents.map(a => a.id === editingAgent.id ? { ...a, title, description } : a),
          agentModalOpen: false,
          editingAgent: null
        });
        addLog(editingAgent.id, "info", `Agent '${title}' details updated by user.`);
      } else {
        // Create mode
        const newId = `agt_${Date.now()}`;
        const newAgent: AIAgent = {
          id: newId,
          title,
          description,
          status: "Idle",
          successRate: 100.0,
          lastExecutionStats: { duration: "N/A", tokensUsed: 0, cost: 0.0 }
        };
        set({
          agents: [...agents, newAgent],
          selectedAgentId: newId,
          agentModalOpen: false
        });
        addLog(newId, "success", `New AI agent thread '${title}' successfully created.`);
      }
    },

    deleteAgent: (id) => {
      const { agents, selectedAgentId, addLog } = get();
      const agent = agents.find(a => a.id === id);
      const remainingAgents = agents.filter(a => a.id !== id);
      
      let nextSelected = selectedAgentId;
      if (selectedAgentId === id) {
        nextSelected = remainingAgents.length > 0 ? remainingAgents[0].id : "";
      }

      set({
        agents: remainingAgents,
        selectedAgentId: nextSelected
      });

      if (agent) {
        addLog(undefined, "warn", `Agent thread '${agent.title}' has been deleted.`);
      }
    },

    openOnboardModal: () => set({ onboardModalOpen: true }),
    closeOnboardModal: () => set({ onboardModalOpen: false }),

    onboardClient: (companyName, email, tier) => {
      const { clientAccounts } = get();
      const newClient: AIClientAccount = {
        id: `cli_${Date.now()}`,
        companyName,
        email,
        tier,
        status: "Active"
      };
      set({
        clientAccounts: [...clientAccounts, newClient],
        onboardModalOpen: false
      });
    },

    toggleClientStatus: (id) => {
      const { clientAccounts } = get();
      set({
        clientAccounts: clientAccounts.map(c => 
          c.id === id 
            ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" }
            : c
        )
      });
    },

    addLog: (agentId, level, message) => {
      const newLog: AILog = {
        id: `log_${Date.now()}_${Math.random()}`,
        agentId,
        timestamp: new Date().toTimeString().split(' ')[0],
        level,
        message
      };
      set((state) => ({ logs: [...state.logs.slice(-99), newLog] }));
    },

    clearLogs: () => {
      const { selectedAgentId } = get();
      // Keep only logs that don't belong to the active filtered agent
      set((state) => ({
        logs: state.logs.filter(log => log.agentId !== selectedAgentId)
      }));
    },

    triggerAgent: (id) => {
      const { agents, addLog } = get();
      const agentIndex = agents.findIndex(a => a.id === id);
      if (agentIndex === -1) return;

      const agent = agents[agentIndex];
      if (agent.status === "Running") return;

      const updatedAgents = [...agents];
      updatedAgents[agentIndex] = { ...agent, status: "Running" };
      set({ agents: updatedAgents });

      addLog(id, "info", `Executing model pipeline thread for: ${agent.title}...`);

      if (simulationTimeouts[id]) {
        clearTimeout(simulationTimeouts[id]);
      }

      const steps = [
        { time: 1000, level: 'info', msg: `Resolving pipeline authentication variables...` },
        { time: 2200, level: 'info', msg: `Querying Qdrant vector database workspace embedding segments...` },
        { time: 3800, level: 'info', msg: `Pushing completion context payloads to target LLM client...` },
        { time: 5500, level: 'success', msg: `Tokens received. Executing webhooks callbacks to endpoints...` }
      ];

      steps.forEach((step) => {
        setTimeout(() => {
          const currentAgents = get().agents;
          const currentAgent = currentAgents.find(a => a.id === id);
          if (currentAgent?.status === "Running") {
            addLog(id, step.level as any, step.msg);
          }
        }, step.time);
      });

      simulationTimeouts[id] = setTimeout(() => {
        const currentAgents = get().agents;
        const currentAgent = currentAgents.find(a => a.id === id);
        if (currentAgent?.status !== "Running") return;

        const isSuccess = Math.random() < 0.95;
        const finalStatus = isSuccess ? "Success" : "Failed";

        const nextAgents = currentAgents.map(a => 
          a.id === id 
            ? { 
                ...a, 
                status: finalStatus as any,
                lastExecutionStats: {
                  duration: `${(4 + Math.random() * 4).toFixed(1)}s`,
                  tokensUsed: Math.floor(15000 + Math.random() * 100000),
                  cost: Number((0.02 + Math.random() * 0.2).toFixed(3))
                }
              } 
            : a
        );

        const currentMetrics = get().globalMetrics;

        set({
          agents: nextAgents,
          globalMetrics: {
            totalExecutions: currentMetrics.totalExecutions + 1,
            avgDuration: Number(((currentMetrics.avgDuration * currentMetrics.totalExecutions + 6) / (currentMetrics.totalExecutions + 1)).toFixed(2)),
            totalTokens: currentMetrics.totalTokens + 38000,
            costSavings: currentMetrics.costSavings + 0.18
          }
        });

        if (isSuccess) {
          addLog(id, "success", `Pipeline execution finished. Status: SUCCESS.`);
        } else {
          addLog(id, "error", `Pipeline execution halted. Webhook response was: FAILED.`);
        }

        setTimeout(() => {
          const finalAgents = get().agents;
          const checkAgent = finalAgents.find(a => a.id === id);
          if (checkAgent && (checkAgent.status === "Success" || checkAgent.status === "Failed")) {
            set({
              agents: finalAgents.map(a => a.id === id ? { ...a, status: "Idle" } : a)
            });
          }
        }, 3000);

      }, 6500);
    },

    stopAgent: (id) => {
      const { agents, addLog } = get();
      if (simulationTimeouts[id]) {
        clearTimeout(simulationTimeouts[id]);
        delete simulationTimeouts[id];
      }

      const agent = agents.find(a => a.id === id);
      if (!agent) return;

      set({
        agents: agents.map(a => a.id === id ? { ...a, status: "Idle" as const } : a)
      });
      addLog(id, "warn", `Pipeline thread execution aborted manually by user.`);
    },

    resetStore: () => {
      Object.keys(simulationTimeouts).forEach(key => {
        clearTimeout(simulationTimeouts[key]);
      });
      simulationTimeouts = {};

      set({
        perspective: 'subscriber',
        agents: INITIAL_AGENTS,
        selectedAgentId: "lead_gen",
        logs: [
          { id: "log_init", agentId: undefined, timestamp: "22:00:00", level: "info", message: "AuraPipeline Agent Workspace initialized successfully." },
          { id: "log_l1", agentId: "lead_gen", timestamp: "22:01:00", level: "info", message: "Standby diagnostics for Lead Prospector passed." },
          { id: "log_c1", agentId: "code_rev", timestamp: "22:01:15", level: "success", message: "PR Reviewer successfully initialized webhook hookups." }
        ],
        providers: INITIAL_PROVIDERS,
        clientAccounts: INITIAL_CLIENTS,
        globalMetrics: {
          totalExecutions: 24912,
          avgDuration: 8.4,
          totalTokens: 142890000,
          costSavings: 2857.80
        },
        agentModalOpen: false,
        editingAgent: null,
        onboardModalOpen: false
      });
    }
  };
});
