import { create } from "zustand";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoState {
  tasks: Task[];
  isAdding: boolean;
  busyTodoIds: string[];
  setTasks: (tasks: Task[]) => void;
  setIsAdding: (isAdding: boolean) => void;
  addBusyTodoId: (id: string) => void;
  removeBusyTodoId: (id: string) => void;
  addTodo: (title: string) => Promise<void>;
  completeTodo: (id: string) => Promise<void>;
}

// Custom type declaration for window.openai
declare global {
  interface Window {
    openai?: {
      toolOutput?: {
        structuredContent?: {
          tasks?: Task[];
        };
      };
    };
  }
}

// MCP bridge setup (fallback tool calling if needed)
let rpcId = 0;
const pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

/* 
// Commented out standard JSON-RPC initialization handshake
const rpcNotify = (method: string, params: any) => {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
};

const rpcRequest = (method: string, params: any) =>
  new Promise((resolve, reject) => {
    const id = ++rpcId;
    pendingRequests.set(id, { resolve, reject });
    window.parent.postMessage(
      { jsonrpc: "2.0", id, method, params },
      "*"
    );
  });

const initializeBridge = async () => {
  const appInfo = { name: "todo-widget", version: "0.1.0" };
  const appCapabilities = {};
  const protocolVersion = "2026-01-26";

  try {
    await rpcRequest("ui/initialize", {
      appInfo,
      appCapabilities,
      protocolVersion,
    });
    rpcNotify("ui/notifications/initialized", {});
  } catch (error) {
    console.error("Failed to initialize the MCP Apps bridge:", error);
    throw error;
  }
};

const bridgeReady = initializeBridge();
*/

// Dynamic tool calling using direct postMessage (without initial handshake wait)
const callTodoTool = async (name: string, payload: any, setTasks: (tasks: Task[]) => void) => {
  const id = ++rpcId;
  pendingRequests.set(id, {
    resolve: (response: any) => {
      if (response?.structuredContent?.tasks) {
        setTasks(response.structuredContent.tasks);
      }
    },
    reject: (err: any) => {
      console.error("Tool call failed:", err);
    }
  });

  window.parent.postMessage(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: payload },
    },
    "*"
  );
};

export const useTodoStore = create<TodoState>((set, get) => {
  // Listen for window.openai globals updates via custom event
  const handleGlobals = (event: Event) => {
    const customEvent = event as CustomEvent<{ globals?: any }>;
    console.log("[ChatGPT Bridge] 🔄 openai:set_globals event received:", customEvent.detail?.globals);
    const newTasks = customEvent.detail?.globals?.toolOutput?.structuredContent?.tasks;
    if (newTasks) {
      set({ tasks: newTasks });
    }
  };

  // Listen for standard postMessage fallback messages
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;

    // Responses
    if (typeof message.id === "number") {
      const pending = pendingRequests.get(message.id);
      if (!pending) return;
      pendingRequests.delete(message.id);

      if (message.error) {
        pending.reject(message.error);
        return;
      }

      pending.resolve(message.result);
      return;
    }

    // Notifications
    if (typeof message.method !== "string") return;
    if (message.method === "ui/notifications/tool-result") {
      if (message.params?.structuredContent?.tasks) {
        set({ tasks: message.params.structuredContent.tasks });
      }
    }
  };

  window.addEventListener("openai:set_globals", handleGlobals);
  window.addEventListener("message", handleMessage);

  // Initial read check on initialization
  if (window.openai?.toolOutput) {
    console.log("[ChatGPT Bridge] 📥 Initial toolResult loaded from window.openai:", window.openai.toolOutput);
  } else if (window.openai) {
    console.log("[ChatGPT Bridge] 🤝 window.openai exists, waiting for toolOutput.");
  } else {
    console.warn("[ChatGPT Bridge] ❌ window.openai is undefined. Make sure this widget is rendering inside ChatGPT.");
  }

  return {
    // Read from window.openai initially if available
    tasks: window.openai?.toolOutput?.structuredContent?.tasks || [],
    isAdding: false,
    busyTodoIds: [],
    setTasks: (tasks) => set({ tasks }),
    setIsAdding: (isAdding) => set({ isAdding }),
    addBusyTodoId: (id) => set((state) => ({ busyTodoIds: [...state.busyTodoIds, id] })),
    removeBusyTodoId: (id) => set((state) => ({ busyTodoIds: state.busyTodoIds.filter((tId) => tId !== id) })),
    addTodo: async (title) => {
      const { isAdding, setTasks } = get();
      if (!title || isAdding) return;
      set({ isAdding: true });
      try {
        await callTodoTool("add_todo", { title }, setTasks);
      } catch (error) {
        console.error("Failed to add todo:", error);
      } finally {
        set({ isAdding: false });
      }
    },
    completeTodo: async (id) => {
      const { busyTodoIds, setTasks, addBusyTodoId, removeBusyTodoId } = get();
      if (busyTodoIds.includes(id)) return;
      addBusyTodoId(id);
      try {
        await callTodoTool("complete_todo", { id }, setTasks);
      } catch (error) {
        console.error("Failed to complete todo:", error);
      } finally {
        removeBusyTodoId(id);
      }
    },
  };
});
